use tauri::command;

#[cfg(target_os = "macos")]
use auto_launch::AutoLaunch;

#[command]
pub fn set_launch_at_login(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let app_name = "Hanzo";
        let app_path = std::env::current_exe()
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();
        
        let auto = AutoLaunch::new(app_name, &app_path, false, &[] as &[&str]);
        
        if enabled {
            auto.enable().map_err(|e| e.to_string())
        } else {
            auto.disable().map_err(|e| e.to_string())
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Launch at login is not implemented for this platform".to_string())
}

#[command]
pub fn get_launch_at_login_status() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        let app_name = "Hanzo";
        let app_path = std::env::current_exe()
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();
        
        let auto = AutoLaunch::new(app_name, &app_path, false, &[] as &[&str]);
        auto.is_enabled().map_err(|e| e.to_string())
    }
    
    #[cfg(not(target_os = "macos"))]
    Ok(false)
}