use tauri::command;
use enigo::{Enigo, Key, Keyboard, Mouse, Settings};
use serde::{Deserialize, Serialize};
use log::{debug, info};
use std::thread;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MousePosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenSize {
    pub width: i32,
    pub height: i32,
}

#[command]
pub fn mouse_move(x: i32, y: i32) -> Result<(), String> {
    info!("Moving mouse to ({}, {})", x, y);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.move_mouse(x, y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn mouse_click(button: String) -> Result<(), String> {
    info!("Mouse click: {}", button);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    let mouse_button = match button.as_str() {
        "left" => enigo::Button::Left,
        "right" => enigo::Button::Right,
        "middle" => enigo::Button::Middle,
        _ => return Err("Invalid mouse button".to_string()),
    };
    
    enigo.button(mouse_button, enigo::Direction::Click).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn mouse_down(button: String) -> Result<(), String> {
    info!("Mouse down: {}", button);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    let mouse_button = match button.as_str() {
        "left" => enigo::Button::Left,
        "right" => enigo::Button::Right,
        "middle" => enigo::Button::Middle,
        _ => return Err("Invalid mouse button".to_string()),
    };
    
    enigo.button(mouse_button, enigo::Direction::Press).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn mouse_up(button: String) -> Result<(), String> {
    info!("Mouse up: {}", button);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    let mouse_button = match button.as_str() {
        "left" => enigo::Button::Left,
        "right" => enigo::Button::Right,
        "middle" => enigo::Button::Middle,
        _ => return Err("Invalid mouse button".to_string()),
    };
    
    enigo.button(mouse_button, enigo::Direction::Release).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn mouse_scroll(dx: i32, dy: i32) -> Result<(), String> {
    info!("Mouse scroll: ({}, {})", dx, dy);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Scroll horizontally
    if dx != 0 {
        enigo.scroll(dx, enigo::Axis::Horizontal).map_err(|e| e.to_string())?;
    }
    
    // Scroll vertically
    if dy != 0 {
        enigo.scroll(dy, enigo::Axis::Vertical).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub fn get_mouse_position() -> Result<MousePosition, String> {
    let enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let (x, y) = enigo.location().map_err(|e| e.to_string())?;
    debug!("Current mouse position: ({}, {})", x, y);
    Ok(MousePosition { x, y })
}

#[command]
pub fn key_press(key: String) -> Result<(), String> {
    info!("Key press: {}", key);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Handle special keys
    let keyboard_key = match key.as_str() {
        "Enter" | "Return" => Key::Return,
        "Tab" => Key::Tab,
        "Space" => Key::Space,
        "Escape" => Key::Escape,
        "Backspace" => Key::Backspace,
        "Delete" => Key::Delete,
        "Home" => Key::Home,
        "End" => Key::End,
        "PageUp" => Key::PageUp,
        "PageDown" => Key::PageDown,
        "UpArrow" => Key::UpArrow,
        "DownArrow" => Key::DownArrow,
        "LeftArrow" => Key::LeftArrow,
        "RightArrow" => Key::RightArrow,
        "F1" => Key::F1,
        "F2" => Key::F2,
        "F3" => Key::F3,
        "F4" => Key::F4,
        "F5" => Key::F5,
        "F6" => Key::F6,
        "F7" => Key::F7,
        "F8" => Key::F8,
        "F9" => Key::F9,
        "F10" => Key::F10,
        "F11" => Key::F11,
        "F12" => Key::F12,
        "Control" => Key::Control,
        "Alt" => Key::Alt,
        "Shift" => Key::Shift,
        "Meta" | "Command" => Key::Meta,
        _ => {
            // For single characters
            if key.len() == 1 {
                if let Some(ch) = key.chars().next() {
                    enigo.text(&ch.to_string()).map_err(|e| e.to_string())?;
                    return Ok(());
                }
            }
            return Err(format!("Unknown key: {}", key));
        }
    };
    
    enigo.key(keyboard_key, enigo::Direction::Click).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn key_down(key: String) -> Result<(), String> {
    info!("Key down: {}", key);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    let keyboard_key = match key.as_str() {
        "Control" => Key::Control,
        "Alt" => Key::Alt,
        "Shift" => Key::Shift,
        "Meta" | "Command" => Key::Meta,
        _ => return Err(format!("Key down only supports modifier keys, got: {}", key)),
    };
    
    enigo.key(keyboard_key, enigo::Direction::Press).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn key_up(key: String) -> Result<(), String> {
    info!("Key up: {}", key);
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    let keyboard_key = match key.as_str() {
        "Control" => Key::Control,
        "Alt" => Key::Alt,
        "Shift" => Key::Shift,
        "Meta" | "Command" => Key::Meta,
        _ => return Err(format!("Key up only supports modifier keys, got: {}", key)),
    };
    
    enigo.key(keyboard_key, enigo::Direction::Release).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn type_text(text: String) -> Result<(), String> {
    info!("Typing text: {} chars", text.len());
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.text(&text).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn get_screen_size() -> Result<ScreenSize, String> {
    let enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let (width, height) = enigo.main_display().map_err(|e| e.to_string())?;
    debug!("Screen size: {}x{}", width, height);
    Ok(ScreenSize { width, height })
}

#[command]
pub fn take_screenshot_region(x: i32, y: i32, width: i32, height: i32) -> Result<Vec<u8>, String> {
    info!("Taking screenshot of region: ({}, {}) {}x{}", x, y, width, height);
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        use std::fs;
        use tempfile::NamedTempFile;
        
        let temp_file = NamedTempFile::new().map_err(|e| e.to_string())?;
        let temp_path = temp_file.path().to_string_lossy().to_string();
        
        Command::new("screencapture")
            .args(&["-x", "-R", &format!("{},{},{},{}", x, y, width, height), &temp_path])
            .output()
            .map_err(|e| e.to_string())?;
        
        thread::sleep(Duration::from_millis(100));
        
        let data = fs::read(&temp_path).map_err(|e| e.to_string())?;
        Ok(data)
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("Screenshot not implemented for this platform".to_string())
    }
}

// Automation examples
#[command]
pub fn automation_example_open_browser() -> Result<(), String> {
    info!("Running automation: Open browser example");
    
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Press Cmd+Space to open Spotlight
    enigo.key(Key::Meta, enigo::Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Space, enigo::Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Meta, enigo::Direction::Release).map_err(|e| e.to_string())?;
    
    thread::sleep(Duration::from_millis(500));
    
    // Type "Safari"
    enigo.text("Safari").map_err(|e| e.to_string())?;
    
    thread::sleep(Duration::from_millis(300));
    
    // Press Enter
    enigo.key(Key::Return, enigo::Direction::Click).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub fn automation_example_type_hello() -> Result<(), String> {
    info!("Running automation: Type hello example");
    
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Wait a bit for user to position cursor
    thread::sleep(Duration::from_secs(2));
    
    // Type a message
    enigo.text("Hello from Hanzo AI! 🚀\n").map_err(|e| e.to_string())?;
    enigo.text("I can control your computer with full automation capabilities.\n").map_err(|e| e.to_string())?;
    enigo.text("Mouse, keyboard, screenshots - everything is possible!").map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub fn automation_example_draw_square() -> Result<(), String> {
    info!("Running automation: Draw square example");
    
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Get current position
    let (start_x, start_y) = enigo.location().map_err(|e| e.to_string())?;
    
    // Press mouse button
    enigo.button(enigo::Button::Left, enigo::Direction::Press).map_err(|e| e.to_string())?;
    
    // Draw a square
    let size = 100;
    let positions = [
        (start_x + size, start_y),
        (start_x + size, start_y + size),
        (start_x, start_y + size),
        (start_x, start_y),
    ];
    
    for (x, y) in positions.iter() {
        enigo.move_mouse(*x, *y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;
        thread::sleep(Duration::from_millis(100));
    }
    
    // Release mouse button
    enigo.button(enigo::Button::Left, enigo::Direction::Release).map_err(|e| e.to_string())?;
    
    Ok(())
}