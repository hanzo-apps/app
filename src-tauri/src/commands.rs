use serde::{Deserialize, Serialize};
use tauri::{command, State, Window, AppHandle, Manager, Emitter};
use crate::state::AppState;
use crate::search::{SearchResult, SearchAction};
use crate::platform;
use fuzzy_matcher::FuzzyMatcher;

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub theme: String,
    pub hotkey_launcher: String,
    pub hotkey_ai: String,
    pub ai_model: String,
    pub ai_api_key: Option<String>,
}

// Window commands
#[command]
pub async fn show_window(window: Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn hide_window(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn toggle_window(window: Window) -> Result<(), String> {
    if window.is_visible().unwrap_or(false) {
        window.hide().map_err(|e| e.to_string())?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Search commands
#[command]
pub async fn search_apps(query: String, state: State<'_, AppState>) -> Result<Vec<SearchResult>, String> {
    let search_index = state.search_index.lock().await;
    let results = search_index.search(&query, 10).await;
    Ok(results)
}

#[command]
pub async fn search_files(_query: String, _paths: Option<Vec<String>>) -> Result<Vec<SearchResult>, String> {
    // TODO: Implement file search with configurable paths
    Ok(vec![])
}

#[command]
pub async fn search_commands(query: String) -> Result<Vec<SearchResult>, String> {
    // Built-in commands
    let commands = vec![
        ("settings", "Settings", "Open Hanzo settings"),
        ("quit", "Quit Hanzo", "Exit the application"),
        ("reload", "Reload", "Reload the application"),
        ("about", "About", "About Hanzo"),
    ];
    
    let matcher = fuzzy_matcher::skim::SkimMatcherV2::default();
    let mut results = Vec::new();
    
    for (id, title, subtitle) in commands {
        if let Some(score) = matcher.fuzzy_match(title, &query) {
            results.push(SearchResult {
                id: id.to_string(),
                title: title.to_string(),
                subtitle: subtitle.to_string(),
                icon: None,
                action: SearchAction::RunCommand { command: id.to_string() },
                score: score as f64,
                metadata: None,
            });
        }
    }
    
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    Ok(results)
}

#[command]
pub async fn get_apps(state: State<'_, AppState>) -> Result<Vec<platform::Application>, String> {
    let apps = platform::get_applications();
    
    // Index apps for search
    let search_index = state.search_index.lock().await;
    search_index.index_applications(apps.clone()).await;
    
    Ok(apps)
}

// AI commands
#[command]
pub async fn ai_chat(
    message: String, 
    model: Option<String>,
    _state: State<'_, AppState>
) -> Result<String, String> {
    // Check if we have Jan's AI service running locally
    let client = reqwest::Client::new();
    let endpoint = "http://localhost:1337/v1/chat/completions";
    
    let request_body = serde_json::json!({
        "model": model.unwrap_or_else(|| "gpt-3.5-turbo".to_string()),
        "messages": [
            {"role": "user", "content": message}
        ],
        "stream": false
    });
    
    match client.post(endpoint)
        .json(&request_body)
        .send()
        .await {
        Ok(response) => {
            if response.status().is_success() {
                let data: serde_json::Value = response.json().await
                    .map_err(|e| format!("Failed to parse response: {}", e))?;
                
                if let Some(content) = data["choices"][0]["message"]["content"].as_str() {
                    return Ok(content.to_string());
                }
            }
        }
        Err(_) => {
            // Fallback to mock response if Jan is not running
            return Ok(format!("I'm Hanzo AI. You said: {}. (Note: Jan AI service is not running locally)", message));
        }
    }
    
    Err("Failed to get AI response".to_string())
}

#[command]
pub async fn ai_complete(
    prompt: String,
    model: Option<String>,
    state: State<'_, AppState>
) -> Result<String, String> {
    // Use the same endpoint as chat but with completion-style prompt
    ai_chat(prompt, model, state).await
}

// System commands
#[command]
pub async fn launch_app(app_id: String) -> Result<(), String> {
    platform::launch_application(&app_id)
}

#[command]
pub async fn open_url(url: String) -> Result<(), String> {
    webbrowser::open(&url).map_err(|e| e.to_string())
}

#[command]
pub async fn open_file(path: String) -> Result<(), String> {
    opener::open(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn execute_command(command: String, app: AppHandle) -> Result<(), String> {
    match command.as_str() {
        "quit" => {
            app.exit(0);
            Ok(())
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                window.eval("window.location.reload()").map_err(|e| e.to_string())?;
            }
            Ok(())
        }
        "settings" => {
            if let Some(window) = app.get_webview_window("main") {
                window.emit("switch:widget", "settings").map_err(|e| e.to_string())?;
            }
            Ok(())
        }
        _ => Err(format!("Unknown command: {}", command))
    }
}

#[command]
pub async fn get_system_info() -> Result<serde_json::Value, String> {
    use sysinfo::System;
    
    let mut system = System::new_all();
    system.refresh_all();
    
    let info = serde_json::json!({
        "hostname": System::host_name(),
        "os": System::name(),
        "os_version": System::os_version(),
        "cpu_count": system.cpus().len(),
        "total_memory": system.total_memory(),
        "used_memory": system.used_memory(),
    });
    
    Ok(info)
}

#[command]
pub async fn paste_to_frontmost_app(text: String) -> Result<(), String> {
    // Platform-specific implementation
    #[cfg(target_os = "macos")]
    {
        // Copy to clipboard first
        let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
        clipboard.set_text(&text).map_err(|e| e.to_string())?;
        
        // Use AppleScript to paste
        std::process::Command::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to keystroke \"v\" using command down")
            .output()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// Process commands
#[command]
pub async fn get_processes() -> Result<Vec<serde_json::Value>, String> {
    use sysinfo::System;
    
    let mut system = System::new_all();
    system.refresh_all();
    
    let mut processes: Vec<serde_json::Value> = system.processes()
        .iter()
        .map(|(pid, process)| {
            serde_json::json!({
                "pid": pid.as_u32(),
                "name": process.name().to_string_lossy(),
                "cpu": process.cpu_usage(),
                "memory": process.memory(),
            })
        })
        .collect();
    
    // Sort by CPU usage
    processes.sort_by(|a, b| {
        let a_cpu = a["cpu"].as_f64().unwrap_or(0.0);
        let b_cpu = b["cpu"].as_f64().unwrap_or(0.0);
        b_cpu.partial_cmp(&a_cpu).unwrap()
    });
    
    Ok(processes.into_iter().take(50).collect())
}

#[command]
pub async fn kill_process(pid: u32) -> Result<(), String> {
    use sysinfo::{System, Pid};
    
    let mut system = System::new_all();
    system.refresh_all();
    
    let pid = Pid::from_u32(pid);
    if let Some(process) = system.process(pid) {
        process.kill();
        Ok(())
    } else {
        Err("Process not found".to_string())
    }
}

// Settings commands
#[command]
pub async fn get_settings(app: AppHandle) -> Result<Settings, String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    
    // Load settings with defaults
    let theme = store.get("theme")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "dark".to_string());
    let hotkey_launcher = store.get("hotkey_launcher")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "Cmd+Space".to_string());
    let hotkey_ai = store.get("hotkey_ai")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "Tab".to_string());
    let ai_model = store.get("ai_model")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "gpt-3.5-turbo".to_string());
    let ai_api_key = store.get("ai_api_key")
        .and_then(|v| v.as_str().map(|s| s.to_string()));
    
    Ok(Settings {
        theme,
        hotkey_launcher,
        hotkey_ai,
        ai_model,
        ai_api_key,
    })
}

#[command]
pub async fn save_settings(settings: Settings, app: AppHandle) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    
    store.set("theme", serde_json::Value::String(settings.theme));
    store.set("hotkey_launcher", serde_json::Value::String(settings.hotkey_launcher));
    store.set("hotkey_ai", serde_json::Value::String(settings.hotkey_ai));
    store.set("ai_model", serde_json::Value::String(settings.ai_model));
    if let Some(key) = settings.ai_api_key {
        store.set("ai_api_key", serde_json::Value::String(key));
    }
    
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

// This function is not used anymore, keeping for compatibility
#[command]
pub async fn register_shortcuts() -> Result<(), String> {
    Ok(())
}