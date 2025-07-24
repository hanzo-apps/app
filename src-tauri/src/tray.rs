use tauri::{
    AppHandle, Runtime, Emitter, Manager,
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{TrayIconBuilder, MouseButton, MouseButtonState},
};

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // Create menu items
    let show_launcher = MenuItemBuilder::with_id("show_launcher", "Show Launcher")
        .accelerator("Cmd+Space")
        .build(app)?;
    
    let show_chat = MenuItemBuilder::with_id("show_chat", "AI Chat")
        .accelerator("Cmd+Shift+C")
        .build(app)?;
    
    let _separator1 = PredefinedMenuItem::separator(app)?;
    
    let dev_tools = MenuItemBuilder::with_id("dev_tools", "Developer Tools")
        .accelerator("Cmd+Option+I")
        .build(app)?;
    
    let show_logs = MenuItemBuilder::with_id("show_logs", "View Logs")
        .build(app)?;
    
    let _separator2 = PredefinedMenuItem::separator(app)?;
    
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
    
    // Create tray icon with a proper icon
    // Load icon from embedded bytes
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    let icon_rgba = image::load_from_memory(icon_bytes)
        .expect("Failed to load icon")
        .to_rgba8();
    let (width, height) = icon_rgba.dimensions();
    let icon = tauri::image::Image::new_owned(
        icon_rgba.into_raw(),
        width,
        height,
    );
    
    let _tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .menu(&menu)
        .tooltip("Hanzo - AI Assistant")
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            println!("Menu event received: {:?}", event.id);
            match event.id.as_ref() {
                "show_launcher" => {
                    println!("Show launcher clicked");
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        // Emit event to show launcher
                        let _ = app.emit("show-launcher", ());
                    }
                }
                "show_chat" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        // Emit event to show chat
                        let _ = app.emit("show-chat", ());
                    }
                }
                "dev_tools" => {
                    if let Some(window) = app.get_webview_window("main") {
                        // Open devtools - method may vary by Tauri version
                        let _ = window.eval("console.log('Developer tools requested')");
                    }
                }
                "show_logs" => {
                    // Emit event to show logs
                    let _ = app.emit("show-logs", ());
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event {
                // Left click shows the launcher
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = app.emit("show-launcher", ());
                    }
                }
            }
        })
        .build(app)?;
    
    Ok(())
}