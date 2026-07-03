//! Minimal Tauri shell for the launcher.
//!
//! The whole UI is the shared `@hanzo/gui` bundle in `../dist`. Rust does only
//! the two things a browser cannot: register the global ⌘Space shortcut and
//! toggle the frameless window. Everything else the palette needs (open URLs)
//! goes through the opener plugin invoked from the frontend.

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let toggle = Shortcut::new(Some(Modifiers::SUPER), Code::Space);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            if event.state() == ShortcutState::Pressed && shortcut == &toggle {
                                if let Some(win) = app.get_webview_window("main") {
                                    if win.is_visible().unwrap_or(false) {
                                        let _ = win.hide();
                                    } else {
                                        let _ = win.show();
                                        let _ = win.set_focus();
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut()
                    .register(Shortcut::new(Some(Modifiers::SUPER), Code::Space))?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Hanzo Launcher");
}
