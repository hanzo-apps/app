use tauri::command;

#[cfg(target_os = "macos")]
use security_framework::passwords::{get_generic_password, set_generic_password, delete_generic_password};

#[command]
pub fn securely_store(key: String, payload: String) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        set_generic_password("Hanzo", &key, payload.as_bytes())
            .map(|_| true)
            .map_err(|e| e.to_string())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // On other platforms, could use OS-specific secure storage
        // For now, return an error
        Err("Secure storage is only implemented for macOS".to_string())
    }
}

#[command]
pub fn securely_retrieve(key: String) -> Result<Option<String>, String> {
    #[cfg(target_os = "macos")]
    {
        match get_generic_password("Hanzo", &key) {
            Ok(password) => {
                String::from_utf8(password)
                    .map(|s| Some(s))
                    .map_err(|e| e.to_string())
            }
            Err(_) => Ok(None), // Key not found
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("Secure storage is only implemented for macOS".to_string())
    }
}

#[command]
pub fn securely_delete(key: String) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        delete_generic_password("Hanzo", &key)
            .map(|_| true)
            .map_err(|e| e.to_string())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("Secure storage is only implemented for macOS".to_string())
    }
}