use serde::{Deserialize, Serialize};
use tauri::{command, State, Window};
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub icon: Option<String>,
    pub action: String,
    pub score: f64,
}

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
pub async fn search_apps(query: String) -> Result<Vec<SearchResult>, String> {
    // TODO: Implement app search for each platform
    let results = vec![
        SearchResult {
            id: "finder".to_string(),
            title: "Finder".to_string(),
            subtitle: "File Manager".to_string(),
            icon: Some("finder.png".to_string()),
            action: "launch_app".to_string(),
            score: 0.9,
        },
    ];
    
    Ok(results)
}

#[command]
pub async fn search_files(query: String) -> Result<Vec<SearchResult>, String> {
    // TODO: Implement file search
    Ok(vec![])
}

#[command]
pub async fn search_commands(query: String) -> Result<Vec<SearchResult>, String> {
    // TODO: Implement command search
    Ok(vec![])
}

// AI commands
#[command]
pub async fn ai_chat(
    message: String, 
    state: State<'_, AppState>
) -> Result<String, String> {
    // TODO: Implement AI chat with local/remote models
    Ok(format!("AI response to: {}", message))
}

#[command]
pub async fn ai_complete(
    prompt: String,
    state: State<'_, AppState>
) -> Result<String, String> {
    // TODO: Implement AI completion
    Ok(format!("Completion for: {}", prompt))
}

// System commands
#[command]
pub async fn launch_app(app_id: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg("-a")
            .arg(&app_id)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("cmd")
            .args(&["/C", "start", "", &app_id])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&app_id)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub async fn open_file(path: String) -> Result<(), String> {
    open_url(path).await
}

#[command]
pub async fn get_apps() -> Result<Vec<SearchResult>, String> {
    let mut apps = Vec::new();
    
    #[cfg(target_os = "macos")]
    {
        use std::fs;
        use std::path::Path;
        
        let app_dirs = vec![
            "/Applications",
            "/System/Applications",
            &format!("{}Applications", std::env::var("HOME").unwrap_or_default()),
        ];
        
        for dir in app_dirs {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("app") {
                        if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                            apps.push(SearchResult {
                                id: name.to_string(),
                                title: name.to_string(),
                                subtitle: "Application".to_string(),
                                icon: None,
                                action: "launch_app".to_string(),
                                score: 1.0,
                            });
                        }
                    }
                }
            }
        }
    }
    
    Ok(apps)
}

#[command]
pub async fn search_files(query: String) -> Result<Vec<serde_json::Value>, String> {
    // TODO: Implement file search
    Ok(vec![])
}

#[command]
pub async fn get_processes() -> Result<Vec<serde_json::Value>, String> {
    // TODO: Implement process listing
    Ok(vec![])
}

#[command]
pub async fn kill_process(pid: u32) -> Result<(), String> {
    // TODO: Implement process killing
    Ok(())
}

#[command]
pub async fn paste_to_frontmost_app() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let script = r#"tell application "System Events" to keystroke "v" using command down"#;
        Command::new("osascript")
            .args(&["-e", script])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub async fn register_shortcuts() -> Result<(), String> {
    // Shortcuts are registered in main.rs
    Ok(())
}

#[command]
pub async fn execute_command(command: String) -> Result<String, String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    let output = Command::new("cmd")
        .args(&["/C", &command])
        .output()
        .map_err(|e| e.to_string())?;
    
    #[cfg(not(target_os = "windows"))]
    let output = Command::new("sh")
        .args(&["-c", &command])
        .output()
        .map_err(|e| e.to_string())?;
    
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[command]
pub async fn get_system_info() -> Result<serde_json::Value, String> {
    use sysinfo::{System, SystemExt};
    
    let mut system = System::new_all();
    system.refresh_all();
    
    Ok(serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "hostname": system.host_name(),
        "memory_total": system.total_memory(),
        "memory_used": system.used_memory(),
        "cpu_count": system.cpus().len(),
    }))
}

// Settings commands
#[command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<Settings, String> {
    state.get_settings().await
}

#[command]
pub async fn save_settings(
    settings: Settings, 
    state: State<'_, AppState>
) -> Result<(), String> {
    state.save_settings(settings).await
}