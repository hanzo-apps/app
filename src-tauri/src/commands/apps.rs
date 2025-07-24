use serde::{Deserialize, Serialize};
use tauri::command;
use log::{debug, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub path: String,
    pub icon: Option<String>,
}

#[command]
pub fn get_apps() -> Result<Vec<AppInfo>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::fs;
        use std::path::Path;
        
        let mut apps = Vec::new();
        let home_apps = format!("{}/Applications", std::env::var("HOME").unwrap_or_default());
        let app_folders = vec![
            "/Applications",
            "/System/Applications",
            "/System/Library/CoreServices",
            home_apps.as_str(),
        ];
        
        info!("Scanning for applications...");
        
        for folder in app_folders {
            debug!("Scanning folder: {}", folder);
            if let Ok(entries) = fs::read_dir(folder) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("app") {
                        if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                            // For now, use emoji icons based on app name
                            let icon = get_app_icon_emoji(name);
                            
                            apps.push(AppInfo {
                                name: name.to_string(),
                                path: path.to_string_lossy().to_string(),
                                icon: Some(icon),
                            });
                        }
                    }
                }
            }
        }
        
        // Sort apps alphabetically
        apps.sort_by(|a, b| a.name.cmp(&b.name));
        
        Ok(apps)
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("App listing is only supported on macOS".to_string())
}

fn get_app_icon_emoji(app_name: &str) -> String {
    let icon = match app_name.to_lowercase().as_str() {
        // Browsers
        "safari" => "🧭",
        "firefox" | "firefox nightly" | "firefox developer edition" => "🦊",
        "google chrome" | "chrome" => "🌐",
        "brave browser" | "brave" => "🦁",
        "microsoft edge" | "edge" => "🌊",
        "opera" => "🎭",
        "tor browser" => "🧅",
        
        // Communication
        "messages" | "imessage" => "💬",
        "facetime" => "📹",
        "mail" => "📧",
        "slack" => "💼",
        "discord" => "🎮",
        "telegram" => "✈️",
        "whatsapp" => "📱",
        "zoom" | "zoom.us" => "📹",
        "microsoft teams" | "teams" => "👥",
        "skype" => "📞",
        
        // Development
        "terminal" => "💻",
        "iterm" | "iterm2" => "🖥️",
        "visual studio code" | "code" => "📝",
        "xcode" => "🔨",
        "sublime text" => "📄",
        "atom" => "⚛️",
        "github desktop" => "🐙",
        "tower" => "🗼",
        "sourcetree" => "🌳",
        "docker" | "docker desktop" => "🐳",
        "postman" => "📮",
        "insomnia" => "😴",
        
        // Productivity
        "finder" => "📁",
        "calendar" => "📅",
        "notes" => "📝",
        "reminders" => "✅",
        "preview" => "👁️",
        "pages" => "📄",
        "numbers" => "📊",
        "keynote" => "🎯",
        "notion" => "📓",
        "obsidian" => "🗿",
        "todoist" => "✔️",
        "things" | "things 3" => "☑️",
        "omnifocus" => "🎯",
        
        // Media
        "music" | "apple music" => "🎵",
        "spotify" => "🎧",
        "vlc" | "vlc media player" => "🎬",
        "quicktime player" => "▶️",
        "final cut pro" => "🎬",
        "logic pro" | "logic pro x" => "🎹",
        "garageband" => "🎸",
        "photos" => "📷",
        "lightroom" => "📸",
        "photoshop" | "adobe photoshop" => "🖼️",
        "illustrator" | "adobe illustrator" => "✏️",
        "sketch" => "💎",
        "figma" => "🎨",
        "affinity designer" => "🎨",
        
        // System & Utilities
        "system preferences" | "system settings" => "⚙️",
        "activity monitor" => "📊",
        "disk utility" => "💿",
        "console" => "📋",
        "keychain access" => "🔐",
        "mission control" => "🚀",
        "time machine" => "⏰",
        "font book" => "🔤",
        "automator" => "🤖",
        "calculator" => "🧮",
        "stickies" => "📌",
        "screenshot" => "📸",
        "home" => "🏠",
        "find my" => "📍",
        
        // Games & Entertainment
        "chess" => "♟️",
        "steam" => "🎮",
        "epic games launcher" => "🎯",
        "minecraft" => "⛏️",
        
        // Other popular apps
        "1password" | "1password 7" | "1password 8" => "🔑",
        "bitwarden" => "🔒",
        "lastpass" => "🔐",
        "nordvpn" => "🔒",
        "expressvpn" => "🚀",
        "dropbox" => "📦",
        "google drive" => "☁️",
        "onedrive" => "☁️",
        "bartender" => "🍺",
        "alfred" => "🎩",
        "cleanmymac" | "cleanmymac x" => "🧹",
        "hazel" => "🌰",
        "fantastical" => "📅",
        "carrot weather" => "🥕",
        "transmit" => "🚚",
        "forklift" => "🏗️",
        "path finder" => "🧭",
        "app store" => "🛍️",
        "setapp" => "📱",
        
        // Default
        _ => "📱"
    };
    
    icon.to_string()
}

#[command]
pub fn open_app(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("App opening is only supported on macOS".to_string())
}