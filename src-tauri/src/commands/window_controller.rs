use tauri::{command, Window, Manager, PhysicalSize};

#[command]
pub fn resize_window_to_content(window: Window, width: u32, height: u32) -> Result<(), String> {
    window
        .set_size(PhysicalSize::new(width, height))
        .map_err(|e| e.to_string())?;
    
    // Center the window after resizing
    if let Ok(monitor) = window.current_monitor() {
        if let Some(monitor) = monitor {
            let monitor_size = monitor.size();
            let monitor_pos = monitor.position();
            
            let x = monitor_pos.x + (monitor_size.width as i32 - width as i32) / 2;
            let y = monitor_pos.y + (monitor_size.height as i32 - height as i32) / 2;
            
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
        }
    }
    
    Ok(())
}

#[command]
pub fn set_window_background_transparent(window: Window) -> Result<(), String> {
    // This is handled by the transparent window config
    Ok(())
}

#[command]
pub fn show_window_with_size(window: Window, width: u32, height: u32) -> Result<(), String> {
    resize_window_to_content(window.clone(), width, height)?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}