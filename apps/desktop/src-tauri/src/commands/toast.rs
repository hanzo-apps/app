use tauri::{command, AppHandle};

#[command]
pub fn show_toast(app: AppHandle, text: String, variant: String, _timeout: u64) -> Result<(), String> {
    // Use Tauri's notification plugin for cross-platform toast notifications
    use tauri_plugin_notification::NotificationExt;
    
    let notification = app.notification();
    
    let builder = notification.builder()
        .title("Hanzo")
        .body(&text);
    
    // Set icon based on variant
    match variant.as_str() {
        "error" => {
            // Could set a custom icon here
        }
        "success" => {
            // Could set a custom icon here
        }
        _ => {}
    }
    
    builder.show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}