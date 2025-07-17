#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WindowEvent, Emitter};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

mod commands;
mod state;
mod search;
mod platform;

#[cfg(test)]
mod commands_test;

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
            
            // Register global shortcuts
            register_shortcuts(&app_handle)?;
            
            // Hide dock icon on macOS for launcher mode
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
                // Hide window when it loses focus (launcher behavior)
                #[cfg(not(debug_assertions))]
                window.hide().unwrap();
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}

fn register_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
    
    let app_handle = app.clone();
    
    // Register global shortcut for launcher (Cmd+Space on macOS, Ctrl+Space on others)
    #[cfg(target_os = "macos")]
    let launcher_shortcut = Shortcut::new(Some(Modifiers::META), Code::Space);
    #[cfg(not(target_os = "macos"))]
    let launcher_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);
    
    app.global_shortcut().on_shortcut(launcher_shortcut, move |_app, _shortcut, _event| {
        if let Some(window) = app_handle.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                window.hide().unwrap();
            } else {
                window.show().unwrap();
                window.set_focus().unwrap();
                window.emit("launcher:show", {}).unwrap();
            }
        }
    })?;
    
    Ok(())
}