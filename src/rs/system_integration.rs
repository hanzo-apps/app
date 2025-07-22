use std::process::Command;
use tauri::command;

#[cfg(target_os = "macos")]
use cocoa::base::nil;
#[cfg(target_os = "macos")]
use objc::{class, msg_send, sel, sel_impl};

// AppleScript execution
#[command]
pub async fn execute_applescript(source: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&source)
            .output()
            .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    #[cfg(not(target_os = "macos"))]
    Err("AppleScript is only available on macOS".to_string())
}

// Bash script execution
#[command]
pub async fn execute_bash(script: String) -> Result<String, String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute bash script: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Accessibility status check
#[command]
pub async fn get_accessibility_status() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        unsafe {
            let trusted = ax_is_process_trusted();
            Ok(trusted)
        }
    }

    #[cfg(not(target_os = "macos"))]
    Ok(true)
}

#[cfg(target_os = "macos")]
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

#[cfg(target_os = "macos")]
unsafe fn ax_is_process_trusted() -> bool {
    AXIsProcessTrusted()
}

// Request accessibility access
#[command]
pub async fn request_accessibility_access() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let script = r#"
            tell application "System Preferences"
                activate
                reveal anchor "Privacy_Accessibility" of pane id "com.apple.preference.security"
            end tell
        "#;
        
        execute_applescript(script.to_string()).await?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    Ok(())
}

// WiFi information
#[command]
pub async fn get_wifi_info() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("system_profiler")
            .args(&["SPAirPortDataType", "-json"])
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            let data = String::from_utf8_lossy(&output.stdout);
            let parsed: serde_json::Value = serde_json::from_str(&data)
                .map_err(|e| e.to_string())?;
            
            // Extract current network info
            if let Some(airport_data) = parsed.get("SPAirPortDataType").and_then(|d| d.get(0)) {
                if let Some(interfaces) = airport_data.get("spairport_airport_interfaces") {
                    if let Some(interface) = interfaces.as_array().and_then(|arr| arr.get(0)) {
                        if let Some(current_network) = interface.get("spairport_current_network_information") {
                            return Ok(serde_json::json!({
                                "ssid": current_network.get("_name").and_then(|n| n.as_str()).unwrap_or(""),
                                "connected": true,
                                "signal_strength": current_network.get("spairport_network_rssi").and_then(|r| r.as_i64()).unwrap_or(0),
                            }));
                        }
                    }
                }
            }
        }
        
        Ok(serde_json::json!({
            "ssid": "",
            "connected": false,
            "signal_strength": 0,
        }))
    }

    #[cfg(not(target_os = "macos"))]
    Ok(serde_json::json!({
        "ssid": "",
        "connected": false,
        "signal_strength": 0,
    }))
}

// Get username
#[command]
pub async fn get_username() -> Result<String, String> {
    Ok(whoami::username())
}

// Toggle Do Not Disturb
#[command]
pub async fn toggle_dnd() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        let script = r#"
            tell application "System Events"
                tell process "ControlCenter"
                    click menu bar item "Do Not Disturb" of menu bar 1
                end tell
            end tell
        "#;
        
        execute_applescript(script.to_string()).await?;
        Ok(true)
    }

    #[cfg(not(target_os = "macos"))]
    Err("DND toggle is only available on macOS".to_string())
}

// Dark mode toggle
#[command]
pub async fn toggle_dark_mode() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let script = r#"
            tell application "System Events"
                tell appearance preferences
                    set dark mode to not dark mode
                end tell
            end tell
        "#;
        
        execute_applescript(script.to_string()).await?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    Err("Dark mode toggle is only available on macOS".to_string())
}

// Full disk access check
#[command]
pub async fn has_full_disk_access() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        // Try to access a protected directory
        let test_path = dirs::home_dir()
            .ok_or("Could not get home directory")?
            .join("Library/Safari/Bookmarks.plist");
        
        Ok(test_path.exists() && std::fs::metadata(&test_path).is_ok())
    }

    #[cfg(not(target_os = "macos"))]
    Ok(true)
}