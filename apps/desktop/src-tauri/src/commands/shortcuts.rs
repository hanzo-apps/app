use tauri::{command, AppHandle, Manager, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

#[command]
pub fn set_global_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    let shortcut = shortcut.parse::<Shortcut>()
        .map_err(|e| format!("Invalid shortcut: {}", e))?;
    
    let app_handle = app.clone();
    let shortcut_str = shortcut.to_string();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, _event| {
            // Emit event when shortcut is triggered
            let _ = app_handle.emit("shortcut-triggered", &shortcut_str);
        })
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub fn unregister_all_shortcuts(app: AppHandle) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_accessibility_status() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Check accessibility status using system command
        let output = Command::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to get UI elements enabled")
            .output()
            .map_err(|e| e.to_string())?;
        
        let result = String::from_utf8_lossy(&output.stdout);
        Ok(result.trim() == "true")
    }
    
    #[cfg(not(target_os = "macos"))]
    Ok(true) // Other platforms don't have this restriction
}

#[command]
pub fn request_accessibility_access() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Open System Preferences > Security & Privacy > Privacy > Accessibility
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Ok(()) // Other platforms don't need this
}