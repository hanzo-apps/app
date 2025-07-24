
mod commands;
mod tray;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
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
    ])
    .setup(|app| {
        // Create system tray
        tray::create_tray(app.handle())?;
        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
