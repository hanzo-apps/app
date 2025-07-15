#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    AppHandle, CustomMenuItem, GlobalShortcutManager, Manager, 
    SystemTray, SystemTrayEvent, SystemTrayMenu, WindowEvent
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

mod commands;
mod state;

use commands::*;
use state::AppState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Initialize app state
            app.manage(AppState::new());
            
            // Setup system tray
            setup_system_tray(&app_handle)?;
            
            // Register global shortcuts
            register_shortcuts(&app_handle)?;
            
            // Hide dock icon on macOS
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window commands
            show_window,
            hide_window,
            toggle_window,
            
            // Search commands
            search_apps,
            search_files,
            search_commands,
            get_apps,
            
            // AI commands
            ai_chat,
            ai_complete,
            
            // System commands
            launch_app,
            open_url,
            open_file,
            execute_command,
            get_system_info,
            paste_to_frontmost_app,
            register_shortcuts,
            
            // Process commands
            get_processes,
            kill_process,
            
            // Settings commands
            get_settings,
            save_settings,
        ])
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            WindowEvent::Focused(false) => {
                // Hide window when it loses focus
                #[cfg(not(debug_assertions))]
                window.hide().unwrap();
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}

fn setup_system_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(settings)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let tray = SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("Hanzo - AI Assistant");
    
    tray.build(app)?;
    
    Ok(())
}

fn register_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.clone();
    
    // Register Tab key for AI assistant
    app.plugin(tauri_plugin_global_shortcut::Builder::default().build())?;
    app.global_shortcut().on_shortcut("Tab", move |_app, _shortcut, _event| {
        if let Some(window) = app_handle.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                window.hide().unwrap();
            } else {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }
    })?;
    
    // Register Cmd+Space for launcher (macOS)
    #[cfg(target_os = "macos")]
    {
        let app_handle_clone = app.clone();
        app.global_shortcut().on_shortcut("Cmd+Space", move |_app, _shortcut, _event| {
            if let Some(window) = app_handle_clone.get_webview_window("launcher") {
                if window.is_visible().unwrap_or(false) {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                    window.emit("launcher:show", {}).unwrap();
                }
            }
        })?;
    }
    
    // Register Ctrl+Space for launcher (Windows/Linux)
    #[cfg(not(target_os = "macos"))]
    {
        let app_handle_clone = app.clone();
        app.global_shortcut().on_shortcut("Ctrl+Space", move |_app, _shortcut, _event| {
            if let Some(window) = app_handle_clone.get_webview_window("launcher") {
                if window.is_visible().unwrap_or(false) {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                    window.emit("launcher:show", {}).unwrap();
                }
            }
        })?;
    }
    
    Ok(())
}