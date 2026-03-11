use tauri::command;

#[command]
pub fn paste_to_frontmost_app(content: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // First, copy content to clipboard
        let script = format!(
            r#"set the clipboard to "{}""#,
            content.replace("\"", "\\\"").replace("\n", "\\n")
        );
        
        Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| e.to_string())?;
        
        // Then simulate Cmd+V
        let paste_script = r#"
            tell application "System Events"
                keystroke "v" using command down
            end tell
        "#;
        
        Command::new("osascript")
            .arg("-e")
            .arg(paste_script)
            .output()
            .map_err(|e| e.to_string())?;
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Paste to frontmost app is only supported on macOS".to_string())
}

#[command]
pub fn insert_to_frontmost_app(content: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Type the content directly
        let script = format!(
            r#"
            tell application "System Events"
                keystroke "{}"
            end tell
            "#,
            content.replace("\"", "\\\"").replace("\n", "\\n")
        );
        
        Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| e.to_string())?;
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Insert to frontmost app is only supported on macOS".to_string())
}