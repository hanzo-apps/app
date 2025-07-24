use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub path: String,
    pub icon: Option<String>,
}

#[command]
pub fn get_apps() -> Result<Vec<AppInfo>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::fs;
        use std::path::Path;
        
        let mut apps = Vec::new();
        let home_apps = format!("{}/Applications", std::env::var("HOME").unwrap_or_default());
        let app_folders = vec![
            "/Applications",
            "/System/Applications",
            "/System/Library/CoreServices",
            home_apps.as_str(),
        ];
        
        for folder in app_folders {
            if let Ok(entries) = fs::read_dir(folder) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("app") {
                        if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                            apps.push(AppInfo {
                                name: name.to_string(),
                                path: path.to_string_lossy().to_string(),
                                icon: None, // TODO: Extract app icon
                            });
                        }
                    }
                }
            }
        }
        
        Ok(apps)
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("App listing is only supported on macOS".to_string())
}

#[command]
pub fn open_app(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("App opening is only supported on macOS".to_string())
}