use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Bookmark {
    title: String,
    url: String,
}

#[command]
pub fn get_safari_bookmarks() -> Result<Vec<Bookmark>, String> {
    #[cfg(target_os = "macos")]
    {
        use std::path::PathBuf;
        use std::fs;
        use plist::Value;
        
        let home = std::env::var("HOME").map_err(|e| e.to_string())?;
        let bookmarks_path = PathBuf::from(home)
            .join("Library/Safari/Bookmarks.plist");
        
        if !bookmarks_path.exists() {
            return Err("Safari bookmarks not found".to_string());
        }
        
        // Note: Reading Safari bookmarks requires Full Disk Access permission
        // The actual parsing would be more complex, this is a simplified version
        Ok(vec![])
    }
    
    #[cfg(not(target_os = "macos"))]
    Err("Safari bookmarks are only available on macOS".to_string())
}

#[command]
pub fn has_full_disk_access() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        // Check if we can access a protected directory
        let home = std::env::var("HOME").map_err(|e| e.to_string())?;
        let test_path = std::path::PathBuf::from(home)
            .join("Library/Safari/Bookmarks.plist");
        
        Ok(std::fs::metadata(&test_path).is_ok())
    }
    
    #[cfg(not(target_os = "macos"))]
    Ok(true) // Other platforms don't have this restriction
}