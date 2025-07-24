use tauri::command;

#[command]
pub fn toggle_do_not_disturb() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Toggle DND using shortcuts command
        Command::new("shortcuts")
            .args(&["run", "Toggle Do Not Disturb"])
            .spawn()
            .map_err(|e| e.to_string())?;
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Do Not Disturb toggle is only supported on macOS".to_string())
}