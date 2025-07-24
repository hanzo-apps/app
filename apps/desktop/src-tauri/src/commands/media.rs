use tauri::command;
use serde_json::json;

#[command]
pub fn get_media_info() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "macos")]
    {
        // This would require implementing MediaRemote framework bindings
        // For now, return a placeholder
        Ok(json!({
            "title": "",
            "artist": "",
            "bundleIdentifier": "",
            "url": null
        }))
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Media info is only supported on macOS".to_string())
}

#[command]
pub fn set_media_key_forwarding_enabled(_enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // This would require implementing media key event handling
        // For now, just return success
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Media key forwarding is only supported on macOS".to_string())
}