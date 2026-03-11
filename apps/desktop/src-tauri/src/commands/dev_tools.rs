use tauri::{command, AppHandle, Manager, WebviewWindow};
use log::info;

#[command]
pub fn open_devtools(window: WebviewWindow) -> Result<(), String> {
    info!("Opening developer tools");
    
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
        Ok(())
    }
    
    #[cfg(not(debug_assertions))]
    {
        let _ = window;
        Err("Developer tools are only available in debug builds".to_string())
    }
}

#[command]
pub fn close_devtools(window: WebviewWindow) -> Result<(), String> {
    info!("Closing developer tools");
    
    #[cfg(debug_assertions)]
    {
        window.close_devtools();
        Ok(())
    }
    
    #[cfg(not(debug_assertions))]
    {
        let _ = window;
        Err("Developer tools are only available in debug builds".to_string())
    }
}

#[command]
pub fn is_devtools_open(window: WebviewWindow) -> Result<bool, String> {
    #[cfg(debug_assertions)]
    {
        Ok(window.is_devtools_open())
    }
    
    #[cfg(not(debug_assertions))]
    {
        let _ = window;
        Ok(false)
    }
}

#[command]
pub fn get_log_dir(app: AppHandle) -> Result<String, String> {
    info!("Getting log directory");
    
    app.path()
        .app_log_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[command]
pub fn open_logs_folder(app: AppHandle) -> Result<(), String> {
    info!("Opening logs folder");
    
    let log_dir = app.path()
        .app_log_dir()
        .map_err(|e| e.to_string())?;
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(log_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(log_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(log_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}