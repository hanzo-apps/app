use tauri::{command, Window};

#[command]
pub fn resize_window_top_half(window: Window) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::{LogicalPosition, LogicalSize};
        
        if let Ok(monitor) = window.current_monitor() {
            if let Some(monitor) = monitor {
                let size = monitor.size();
                let scale = monitor.scale_factor();
                
                let new_width = (size.width as f64 / scale) as u32;
                let new_height = (size.height as f64 / scale / 2.0) as u32;
                
                window.set_size(LogicalSize::new(new_width, new_height))
                    .map_err(|e| e.to_string())?;
                window.set_position(LogicalPosition::new(0, 0))
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Window resizing is only supported on macOS".to_string())
}

#[command]
pub fn resize_window_bottom_half(window: Window) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::{LogicalPosition, LogicalSize};
        
        if let Ok(monitor) = window.current_monitor() {
            if let Some(monitor) = monitor {
                let size = monitor.size();
                let scale = monitor.scale_factor();
                
                let new_width = (size.width as f64 / scale) as u32;
                let new_height = (size.height as f64 / scale / 2.0) as u32;
                let y_pos = new_height as i32;
                
                window.set_size(LogicalSize::new(new_width, new_height))
                    .map_err(|e| e.to_string())?;
                window.set_position(LogicalPosition::new(0, y_pos))
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Window resizing is only supported on macOS".to_string())
}

#[command]
pub fn resize_window_left_half(window: Window) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::{LogicalPosition, LogicalSize};
        
        if let Ok(monitor) = window.current_monitor() {
            if let Some(monitor) = monitor {
                let size = monitor.size();
                let scale = monitor.scale_factor();
                
                let new_width = (size.width as f64 / scale / 2.0) as u32;
                let new_height = (size.height as f64 / scale) as u32;
                
                window.set_size(LogicalSize::new(new_width, new_height))
                    .map_err(|e| e.to_string())?;
                window.set_position(LogicalPosition::new(0, 0))
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Window resizing is only supported on macOS".to_string())
}

#[command]
pub fn resize_window_right_half(window: Window) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::{LogicalPosition, LogicalSize};
        
        if let Ok(monitor) = window.current_monitor() {
            if let Some(monitor) = monitor {
                let size = monitor.size();
                let scale = monitor.scale_factor();
                
                let new_width = (size.width as f64 / scale / 2.0) as u32;
                let new_height = (size.height as f64 / scale) as u32;
                let x_pos = new_width as i32;
                
                window.set_size(LogicalSize::new(new_width, new_height))
                    .map_err(|e| e.to_string())?;
                window.set_position(LogicalPosition::new(x_pos, 0))
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Window resizing is only supported on macOS".to_string())
}

#[command]
pub fn resize_window_fullscreen(window: Window) -> Result<(), String> {
    window.set_fullscreen(true)
        .map_err(|e| e.to_string())
}