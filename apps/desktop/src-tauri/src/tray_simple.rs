use tauri::{
    AppHandle, Runtime, Emitter, Manager,
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::TrayIconBuilder,
};

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // Create menu items
    let show_launcher = MenuItemBuilder::with_id("show_launcher", "Show Launcher")
        .accelerator("Cmd+Space")
        .build(app)?;
    
    let show_chat = MenuItemBuilder::with_id("show_chat", "AI Chat")
        .accelerator("Cmd+Shift+C")
        .build(app)?;
    
    let dev_tools = MenuItemBuilder::with_id("dev_tools", "Developer Tools")
        .accelerator("Cmd+Option+I")
        .build(app)?;
    
    let show_logs = MenuItemBuilder::with_id("show_logs", "View Logs")
        .build(app)?;
    
    let quit = PredefinedMenuItem::quit(app, Some("Quit Hanzo"))?;
    
    // Build the menu
    let menu = MenuBuilder::new(app)
        .item(&show_launcher)
        .item(&show_chat)
        .separator()
        .item(&dev_tools)
        .item(&show_logs)
        .separator()
        .item(&quit)
        .build()?;
    
    // Create tray with custom icon
    // For now, always use the regular icon
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    
    // Use image crate to properly decode the PNG and get dimensions
    let icon_image = image::load_from_memory(icon_bytes)
        .expect("Failed to load tray icon")
        .to_rgba8();
    let (width, height) = icon_image.dimensions();
    let icon = tauri::image::Image::new_owned(
        icon_image.into_raw(),
        width,
        height,
    );
    
    let _tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .menu(&menu)
        .tooltip("Hanzo - AI Assistant")
        .on_menu_event(move |app, event| {
            match event.id.as_ref() {
                "show_launcher" => {
                    // Get or create the main window
                    let window = match app.get_webview_window("main") {
                        Some(win) => win,
                        None => {
                            // Create window if it doesn't exist
                            let _ = tauri::WebviewWindowBuilder::new(
                                app,
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
                            
                            if let Some(win) = app.get_webview_window("main") {
                                win
                            } else {
                                return;
                            }
                        }
                    };
                    
                    let _ = window.show();
                    let _ = window.set_focus();
                    // Emit to switch to launcher view
                    let _ = app.emit("switch-view", "launcher");
                }
                "show_chat" => {
                    // Get or create the main window
                    let window = match app.get_webview_window("main") {
                        Some(win) => win,
                        None => {
                            // Create window if it doesn't exist
                            let _ = tauri::WebviewWindowBuilder::new(
                                app,
                                "main",
                                tauri::WebviewUrl::App("index.html".into())
                            )
                            .title("Hanzo")
                            .inner_size(800.0, 600.0)
                            .resizable(true)
                            .transparent(false)
                            .decorations(true)
                            .center()
                            .build();
                            
                            if let Some(win) = app.get_webview_window("main") {
                                win
                            } else {
                                return;
                            }
                        }
                    };
                    
                    let _ = window.show();
                    let _ = window.set_focus();
                    // Emit to switch to chat view
                    let _ = app.emit("switch-view", "chat");
                }
                "dev_tools" => {
                    if let Some(window) = app.get_webview_window("main") {
                        // Use invoke command to open devtools
                        let _ = window.eval("
                            if (window.__TAURI_INTERNALS__) {
                                window.__TAURI_INTERNALS__.invoke('open_devtools');
                            }
                        ");
                    }
                }
                "show_logs" => {
                    // Open logs folder
                    if let Ok(log_dir) = app.path().app_log_dir() {
                        #[cfg(target_os = "macos")]
                        {
                            let _ = std::process::Command::new("open")
                                .arg(log_dir)
                                .spawn();
                        }
                    }
                }
                _ => {}
            }
        })
        .build(app)?;
    
    Ok(())
}