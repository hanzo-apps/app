use tauri::{command, AppHandle, Manager, Emitter};

#[command]
pub fn set_status_bar_item_title(app: AppHandle, title: String) -> Result<(), String> {
    // Update the system tray tooltip/title
    // Note: In Tauri v2, we need to emit an event to update the tray
    app.emit("update-tray-tooltip", &title)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}