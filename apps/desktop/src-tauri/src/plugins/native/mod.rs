use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;
// FFI bridge disabled until we have the Swift framework
// #[cfg(target_os = "macos")]
// mod swift_bridge;

pub use commands::*;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("native")
        .invoke_handler(tauri::generate_handler![
            // Application management
            get_all_applications,
            get_running_applications,
            launch_application,
            get_app_icon,
            
            // Window management
            move_window_left,
            move_window_right,
            move_window_fullscreen,
            center_window,
            
            // File system
            native_search_files,
            get_file_metadata,
            generate_preview,
            
            // System features
            get_calendar_events,
            check_do_not_disturb,
            read_from_clipboard,
            write_to_clipboard,
            get_clipboard_history,
            
            // Keychain
            save_to_keychain,
            read_from_keychain,
            delete_from_keychain,
        ])
        .build()
}