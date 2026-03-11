
mod commands;
mod tray_simple;
mod plugins;

use commands::*;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{Manager, Emitter};

use tauri_plugin_log::{Builder as LogBuilder, Target, TargetKind};

#[cfg(debug_assertions)]
const LOG_TARGETS: [Target; 3] = [
    Target::new(TargetKind::Stdout),
    Target::new(TargetKind::Webview),
    Target::new(TargetKind::LogDir { file_name: None }),
];

#[cfg(not(debug_assertions))]
const LOG_TARGETS: [Target; 2] = [
    Target::new(TargetKind::Stdout),
    Target::new(TargetKind::LogDir { file_name: None }),
];

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
        LogBuilder::new()
            .targets(LOG_TARGETS)
            .level(log::LevelFilter::Info)
            .level_for("tauri", log::LevelFilter::Warn)
            .level_for("tao", log::LevelFilter::Warn)
            .level_for("app", log::LevelFilter::Debug)
            .build(),
    )
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    // .plugin(tauri_plugin_updater::Builder::default().build()) // Temporarily disabled - needs configuration
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_global_shortcut::Builder::default().build())
    .plugin(tauri_plugin_process::init())
    .plugin(plugins::native::init())
    .invoke_handler(tauri::generate_handler![
        // System commands
        toggle_dark_mode,
        get_os_version,
        execute_apple_script,
        execute_bash_script,
        
        // App commands
        get_apps,
        open_app,
        
        // Window commands
        resize_window_top_half,
        resize_window_bottom_half,
        resize_window_left_half,
        resize_window_right_half,
        resize_window_fullscreen,
        
        // Clipboard commands
        paste_to_frontmost_app,
        insert_to_frontmost_app,
        
        // File commands
        open_file,
        open_with_finder,
        search_files,
        
        // Shortcut commands
        set_global_shortcut,
        unregister_all_shortcuts,
        get_accessibility_status,
        request_accessibility_access,
        
        // Media commands
        get_media_info,
        set_media_key_forwarding_enabled,
        
        // Keychain commands
        securely_store,
        securely_retrieve,
        securely_delete,
        
        // Toast commands
        show_toast,
        
        // WiFi commands
        generate_wifi_qr,
        
        // Bookmark commands
        get_safari_bookmarks,
        has_full_disk_access,
        
        // Do Not Disturb commands
        toggle_do_not_disturb,
        
        // Launch commands
        set_launch_at_login,
        get_launch_at_login_status,
        
        // Status bar commands
        set_status_bar_item_title,
        
        // LLM commands
        load_model,
        unload_model,
        generate_text,
        stream_generate,
        get_model_info,
        list_available_models,
        
        // Window controller commands
        resize_window_to_content,
        set_window_background_transparent,
        show_window_with_size,
        
        // Developer tools commands
        open_devtools,
        close_devtools,
        is_devtools_open,
        get_log_dir,
        open_logs_folder,
        
        // Computer control commands
        mouse_move,
        mouse_click,
        mouse_down,
        mouse_up,
        mouse_scroll,
        get_mouse_position,
        key_press,
        key_down,
        key_up,
        type_text,
        get_screen_size,
        take_screenshot_region,
        automation_example_open_browser,
        automation_example_type_hello,
        automation_example_draw_square,
        
        // Voice commands
        speak_text,
        stop_speaking,
        get_available_voices,
        voice_demo_hello,
        voice_demo_dramatic,
    ])
    .setup(|app| {
        // Initialize llama state
        app.manage(Arc::new(Mutex::new(commands::llama::LlamaState::default())));
        
        // Create system tray after initializing other components
        if let Err(e) = tray_simple::create_tray(app.handle()) {
            eprintln!("Failed to create tray: {}", e);
            // Continue without tray instead of crashing
        }
        
        // Note: Dock menu and dock click handling is implemented in the run() event handler below
        
        Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| match event {
        // Handle dock icon click on macOS
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            // When dock icon is clicked, show the launcher
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = app_handle.emit("switch-view", "launcher");
            } else {
                // Create window if it doesn't exist
                let _ = tauri::WebviewWindowBuilder::new(
                    app_handle,
                    "main",
                    tauri::WebviewUrl::App("index.html".into())
                )
                .title("Hanzo")
                .inner_size(600.0, 400.0)
                .resizable(false)
                .transparent(true)
                .decorations(false)
                .center()
                .build();
                
                let _ = app_handle.emit("switch-view", "launcher");
            }
        }
        _ => {}
    });
}
