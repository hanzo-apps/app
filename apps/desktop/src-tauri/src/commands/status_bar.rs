use tauri::{command, AppHandle, Emitter, Manager};

#[command]
pub fn set_status_bar_item_title(app: AppHandle, title: String) -> Result<(), String> {
    // Set the macOS status-bar text next to the tray icon directly. `set_title`
    // with an empty string clears it (falls back to icon-only).
    if let Some(tray) = app.tray_by_id("main") {
        let value = if title.is_empty() { None } else { Some(title.as_str()) };
        tray.set_title(value).map_err(|e| e.to_string())?;
    }

    // Also broadcast for any webview listeners that mirror the title.
    app.emit("update-tray-tooltip", &title)
        .map_err(|e| e.to_string())?;

    Ok(())
}