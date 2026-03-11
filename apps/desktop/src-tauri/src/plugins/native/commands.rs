use serde::{Deserialize, Serialize};
use tauri::command;
use std::collections::HashSet;

#[derive(Debug, Serialize, Deserialize)]
pub struct Application {
    pub name: String,
    pub bundle_id: String,
    pub path: String,
    pub icon: Option<String>,
    pub is_running: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: String,
    pub kind: String,
}

// Application Management Commands
#[command]
pub async fn get_all_applications() -> Result<Vec<Application>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        use std::collections::HashSet;
        
        // Use mdfind to search for applications
        let output = Command::new("mdfind")
            .args(&["kMDItemContentType == 'com.apple.application-bundle'"])
            .output()
            .map_err(|e| e.to_string())?;
            
        if !output.status.success() {
            return Err("Failed to search for applications".to_string());
        }
            
        let paths = String::from_utf8_lossy(&output.stdout);
        let mut apps = Vec::new();
        let mut seen_names = HashSet::new();
        
        // Get running apps to check status
        let running_apps = get_running_app_names();
        
        for path in paths.lines() {
            if path.is_empty() { continue; }
            
            if let Some(name) = std::path::Path::new(path)
                .file_stem()
                .and_then(|s| s.to_str()) {
                
                // Skip duplicates
                if seen_names.contains(name) { continue; }
                seen_names.insert(name.to_string());
                
                // Extract bundle ID from Info.plist if possible
                let bundle_id = extract_bundle_id(path).unwrap_or_else(|| {
                    format!("com.{}", name.to_lowercase().replace(" ", "-"))
                });
                
                apps.push(Application {
                    name: name.to_string(),
                    bundle_id,
                    path: path.to_string(),
                    icon: None, // We'll extract this separately
                    is_running: running_apps.contains(name),
                });
            }
        }
        
        // Sort by name
        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        
        Ok(apps)
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

// Helper function to get running app names
#[cfg(target_os = "macos")]
fn get_running_app_names() -> HashSet<String> {
    use std::process::Command;
    use std::collections::HashSet;
    
    let mut names = HashSet::new();
    
    if let Ok(output) = Command::new("osascript")
        .args(&["-e", "tell application \"System Events\" to get name of every process whose background only is false"])
        .output() {
        
        let apps_str = String::from_utf8_lossy(&output.stdout);
        for name in apps_str.split(", ") {
            names.insert(name.trim().to_string());
        }
    }
    
    names
}

// Helper function to extract bundle ID from Info.plist
#[cfg(target_os = "macos")]
fn extract_bundle_id(app_path: &str) -> Option<String> {
    use std::fs;
    use std::path::Path;
    
    let plist_path = Path::new(app_path).join("Contents/Info.plist");
    
    if let Ok(content) = fs::read_to_string(&plist_path) {
        // Simple regex to find CFBundleIdentifier
        if let Some(start) = content.find("<key>CFBundleIdentifier</key>") {
            if let Some(value_start) = content[start..].find("<string>") {
                let value_start = start + value_start + 8;
                if let Some(value_end) = content[value_start..].find("</string>") {
                    return Some(content[value_start..value_start + value_end].to_string());
                }
            }
        }
    }
    
    None
}

#[command]
pub async fn get_running_applications() -> Result<Vec<Application>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("ps")
            .args(&["aux"])
            .output()
            .map_err(|e| e.to_string())?;
            
        // Parse running processes
        // This is simplified - in production, use proper macOS APIs
        Ok(vec![])
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn launch_application(bundle_id: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Try to launch by bundle ID first
        let result = Command::new("open")
            .args(&["-b", &bundle_id])
            .output()
            .map_err(|e| e.to_string())?;
            
        if !result.status.success() {
            // If bundle ID fails, try by app path
            let apps = get_all_applications().await?;
            if let Some(app) = apps.iter().find(|a| a.bundle_id == bundle_id) {
                Command::new("open")
                    .arg(&app.path)
                    .spawn()
                    .map_err(|e| e.to_string())?;
            } else {
                return Err(format!("Application with bundle ID {} not found", bundle_id));
            }
        }
            
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

// Window Management Commands
#[command]
pub async fn move_window_left() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Get screen dimensions first
        let screen_script = r#"
            tell application "Finder"
                get bounds of window of desktop
            end tell
        "#;
        
        let screen_output = Command::new("osascript")
            .args(&["-e", screen_script])
            .output()
            .map_err(|e| format!("Failed to get screen bounds: {}", e))?;
            
        let screen_bounds = String::from_utf8_lossy(&screen_output.stdout);
        let bounds_parts: Vec<&str> = screen_bounds.trim().split(", ").collect();
        
        if bounds_parts.len() >= 4 {
            let screen_width: i32 = bounds_parts[2].parse().unwrap_or(1440);
            let screen_height: i32 = bounds_parts[3].parse().unwrap_or(900);
            
            // Move window to left half
            let script = format!(r#"
                tell application "System Events"
                    set frontApp to name of first application process whose frontmost is true
                end tell
                
                tell application frontApp
                    set bounds of front window to {{0, 23, {}, {}}}
                end tell
            "#, screen_width / 2, screen_height);
            
            Command::new("osascript")
                .args(&["-e", &script])
                .output()
                .map_err(|e| format!("Failed to move window: {}", e))?;
        }
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

// File System Commands
#[command]
pub async fn native_search_files(query: String, path: Option<String>) -> Result<Vec<FileSearchResult>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let mut cmd = Command::new("mdfind");
        
        if let Some(search_path) = path {
            cmd.args(&["-onlyin", &search_path]);
        }
        
        cmd.arg(&query);
        
        let output = cmd.output().map_err(|e| e.to_string())?;
        let paths = String::from_utf8_lossy(&output.stdout);
        
        let mut results = Vec::new();
        for path in paths.lines().take(100) { // Limit results
            if let Ok(metadata) = std::fs::metadata(path) {
                results.push(FileSearchResult {
                    path: path.to_string(),
                    name: std::path::Path::new(path)
                        .file_name()
                        .and_then(|s| s.to_str())
                        .unwrap_or("")
                        .to_string(),
                    size: metadata.len(),
                    modified: format!("{:?}", metadata.modified().unwrap_or(std::time::UNIX_EPOCH)),
                    kind: if metadata.is_dir() { "Folder" } else { "File" }.to_string(),
                });
            }
        }
        
        Ok(results)
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

// Extract app icon as base64
#[command]
pub async fn get_app_icon(app_path: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        use std::path::Path;
        
        // First, try to extract the icon using sips
        let icon_path = Path::new(&app_path).join("Contents/Resources");
        
        // Look for .icns files
        let icns_search = Command::new("find")
            .arg(&icon_path)
            .args(&["-name", "*.icns", "-type", "f"])
            .output();
            
        if let Ok(output) = icns_search {
            if output.status.success() {
                let paths = String::from_utf8_lossy(&output.stdout);
                if let Some(first_icon) = paths.lines().next() {
                    // Convert icns to PNG and encode as base64
                    let temp_path = "/tmp/hanzo_app_icon.png";
                    
                    let convert_result = Command::new("sips")
                        .args(&["-s", "format", "png", first_icon, "--out", temp_path])
                        .output();
                        
                    if let Ok(result) = convert_result {
                        if result.status.success() {
                            // Read and encode as base64
                            if let Ok(icon_data) = std::fs::read(temp_path) {
                                use base64::{Engine as _, engine::general_purpose};
                                let encoded = general_purpose::STANDARD.encode(&icon_data);
                                let _ = std::fs::remove_file(temp_path);
                                return Ok(format!("data:image/png;base64,{}", encoded));
                            }
                        }
                    }
                }
            }
        }
        
        // Fallback: return empty string if icon extraction fails
        Ok("".to_string())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn move_window_right() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Get screen dimensions
        let screen_script = r#"
            tell application "Finder"
                get bounds of window of desktop
            end tell
        "#;
        
        let screen_output = Command::new("osascript")
            .args(&["-e", screen_script])
            .output()
            .map_err(|e| format!("Failed to get screen bounds: {}", e))?;
            
        let screen_bounds = String::from_utf8_lossy(&screen_output.stdout);
        let bounds_parts: Vec<&str> = screen_bounds.trim().split(", ").collect();
        
        if bounds_parts.len() >= 4 {
            let screen_width: i32 = bounds_parts[2].parse().unwrap_or(1440);
            let screen_height: i32 = bounds_parts[3].parse().unwrap_or(900);
            let half_width = screen_width / 2;
            
            // Move window to right half
            let script = format!(r#"
                tell application "System Events"
                    set frontApp to name of first application process whose frontmost is true
                end tell
                
                tell application frontApp
                    set bounds of front window to {{{}, 23, {}, {}}}
                end tell
            "#, half_width, screen_width, screen_height);
            
            Command::new("osascript")
                .args(&["-e", &script])
                .output()
                .map_err(|e| format!("Failed to move window: {}", e))?;
        }
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn move_window_fullscreen() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Get screen dimensions
        let screen_script = r#"
            tell application "Finder"
                get bounds of window of desktop
            end tell
        "#;
        
        let screen_output = Command::new("osascript")
            .args(&["-e", screen_script])
            .output()
            .map_err(|e| format!("Failed to get screen bounds: {}", e))?;
            
        let screen_bounds = String::from_utf8_lossy(&screen_output.stdout);
        let bounds_parts: Vec<&str> = screen_bounds.trim().split(", ").collect();
        
        if bounds_parts.len() >= 4 {
            let screen_width: i32 = bounds_parts[2].parse().unwrap_or(1440);
            let screen_height: i32 = bounds_parts[3].parse().unwrap_or(900);
            
            // Maximize window
            let script = format!(r#"
                tell application "System Events"
                    set frontApp to name of first application process whose frontmost is true
                end tell
                
                tell application frontApp
                    set bounds of front window to {{0, 23, {}, {}}}
                end tell
            "#, screen_width, screen_height);
            
            Command::new("osascript")
                .args(&["-e", &script])
                .output()
                .map_err(|e| format!("Failed to maximize window: {}", e))?;
        }
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn center_window() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Get screen dimensions
        let screen_script = r#"
            tell application "Finder"
                get bounds of window of desktop
            end tell
        "#;
        
        let screen_output = Command::new("osascript")
            .args(&["-e", screen_script])
            .output()
            .map_err(|e| format!("Failed to get screen bounds: {}", e))?;
            
        let screen_bounds = String::from_utf8_lossy(&screen_output.stdout);
        let bounds_parts: Vec<&str> = screen_bounds.trim().split(", ").collect();
        
        if bounds_parts.len() >= 4 {
            let screen_width: i32 = bounds_parts[2].parse().unwrap_or(1440);
            let screen_height: i32 = bounds_parts[3].parse().unwrap_or(900);
            
            // Get current window size
            let window_script = r#"
                tell application "System Events"
                    set frontApp to name of first application process whose frontmost is true
                end tell
                
                tell application frontApp
                    get bounds of front window
                end tell
            "#;
            
            let window_output = Command::new("osascript")
                .args(&["-e", window_script])
                .output()
                .map_err(|e| format!("Failed to get window bounds: {}", e))?;
                
            let window_bounds = String::from_utf8_lossy(&window_output.stdout);
            let window_parts: Vec<&str> = window_bounds.trim().split(", ").collect();
            
            if window_parts.len() >= 4 {
                let window_width = window_parts[2].parse::<i32>().unwrap_or(600) - window_parts[0].parse::<i32>().unwrap_or(0);
                let window_height = window_parts[3].parse::<i32>().unwrap_or(400) - window_parts[1].parse::<i32>().unwrap_or(0);
                
                let x = (screen_width - window_width) / 2;
                let y = (screen_height - window_height) / 2;
                
                // Center window
                let script = format!(r#"
                    tell application "System Events"
                        set frontApp to name of first application process whose frontmost is true
                    end tell
                    
                    tell application frontApp
                        set bounds of front window to {{{}, {}, {}, {}}}
                    end tell
                "#, x, y, x + window_width, y + window_height);
                
                Command::new("osascript")
                    .args(&["-e", &script])
                    .output()
                    .map_err(|e| format!("Failed to center window: {}", e))?;
            }
        }
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn get_file_metadata(path: String) -> Result<serde_json::Value, String> {
    #[cfg(target_os = "macos")]
    {
        use std::fs;
        use std::time::UNIX_EPOCH;
        
        match fs::metadata(&path) {
            Ok(metadata) => {
                let modified = metadata.modified()
                    .unwrap_or(UNIX_EPOCH)
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
                    
                let created = metadata.created()
                    .unwrap_or(UNIX_EPOCH)
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
                    
                Ok(serde_json::json!({
                    "path": path,
                    "name": std::path::Path::new(&path).file_name().and_then(|s| s.to_str()).unwrap_or(""),
                    "size": metadata.len(),
                    "is_file": metadata.is_file(),
                    "is_dir": metadata.is_dir(),
                    "modified": modified,
                    "created": created,
                    "readonly": metadata.permissions().readonly()
                }))
            }
            Err(e) => Err(format!("Failed to get file metadata: {}", e))
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn generate_preview(path: String) -> Result<String, String> {
    Ok("".to_string())
}

#[command]
pub async fn get_calendar_events() -> Result<Vec<serde_json::Value>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Use AppleScript to get calendar events
        let script = r#"
            tell application "Calendar"
                set eventList to {}
                set todayStart to current date
                set hours of todayStart to 0
                set minutes of todayStart to 0
                set seconds of todayStart to 0
                set todayEnd to todayStart + (1 * days)
                
                repeat with cal in calendars
                    repeat with evt in (every event of cal whose start date ≥ todayStart and start date < todayEnd)
                        set eventInfo to {summary:(summary of evt), startDate:(start date of evt as string), endDate:(end date of evt as string), location:(location of evt)}
                        set end of eventList to eventInfo
                    end repeat
                end repeat
                
                return eventList
            end tell
        "#;
        
        let output = Command::new("osascript")
            .args(&["-e", script])
            .output()
            .map_err(|e| format!("Failed to get calendar events: {}", e))?;
            
        if output.status.success() {
            // Parse AppleScript output into JSON
            // This is simplified - real implementation would parse the AppleScript return format
            Ok(vec![])
        } else {
            Ok(vec![]) // Return empty if Calendar access is denied
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn check_do_not_disturb() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Check if Do Not Disturb is enabled via defaults
        let output = Command::new("defaults")
            .args(&["-currentHost", "read", "com.apple.notificationcenterui", "doNotDisturb"])
            .output()
            .map_err(|e| format!("Failed to check DND status: {}", e))?;
            
        if output.status.success() {
            let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Ok(result == "1")
        } else {
            // Alternative method: check via AppleScript
            let script = r#"
                do shell script "defaults -currentHost read com.apple.notificationcenterui doNotDisturb" 
            "#;
            
            let output = Command::new("osascript")
                .args(&["-e", script])
                .output();
                
            match output {
                Ok(result) if result.status.success() => {
                    let value = String::from_utf8_lossy(&result.stdout).trim().to_string();
                    Ok(value == "1")
                }
                _ => Ok(false)
            }
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn read_from_clipboard() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("pbpaste")
            .output()
            .map_err(|e| format!("Failed to read clipboard: {}", e))?;
            
        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err("Failed to read from clipboard".to_string())
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn write_to_clipboard(text: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::{Command, Stdio};
        use std::io::Write;
        
        let mut child = Command::new("pbcopy")
            .stdin(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn pbcopy: {}", e))?;
            
        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(text.as_bytes())
                .map_err(|e| format!("Failed to write to clipboard: {}", e))?;
        }
        
        child.wait()
            .map_err(|e| format!("Failed to wait for pbcopy: {}", e))?;
            
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

// Clipboard history requires a persistent service, so we'll use a simple file-based approach
#[command]
pub async fn get_clipboard_history() -> Result<Vec<String>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::fs;
        use std::path::PathBuf;
        
        // Get app support directory
        let home = std::env::var("HOME").map_err(|_| "Failed to get HOME directory".to_string())?;
        let history_path = PathBuf::from(home)
            .join("Library/Application Support/hanzo/clipboard_history.json");
            
        if history_path.exists() {
            let content = fs::read_to_string(&history_path)
                .map_err(|e| format!("Failed to read clipboard history: {}", e))?;
                
            if let Ok(history) = serde_json::from_str::<Vec<String>>(&content) {
                Ok(history)
            } else {
                Ok(vec![])
            }
        } else {
            Ok(vec![])
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn save_to_keychain(service: String, account: String, password: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("security")
            .args(&[
                "add-generic-password",
                "-a", &account,
                "-s", &service,
                "-w", &password,
                "-U"  // Update if exists
            ])
            .output()
            .map_err(|e| format!("Failed to save to keychain: {}", e))?;
            
        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to save to keychain: {}", stderr))
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn read_from_keychain(service: String, account: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("security")
            .args(&[
                "find-generic-password",
                "-a", &account,
                "-s", &service,
                "-w"  // Output password only
            ])
            .output()
            .map_err(|e| format!("Failed to read from keychain: {}", e))?;
            
        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        } else {
            Err("Password not found in keychain".to_string())
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}

#[command]
pub async fn delete_from_keychain(service: String, account: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("security")
            .args(&[
                "delete-generic-password",
                "-a", &account,
                "-s", &service
            ])
            .output()
            .map_err(|e| format!("Failed to delete from keychain: {}", e))?;
            
        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("could not be found") {
                Ok(()) // Not an error if it doesn't exist
            } else {
                Err(format!("Failed to delete from keychain: {}", stderr))
            }
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("This feature is only available on macOS".to_string())
}