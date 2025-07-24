// Platform-specific functionality

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "linux")]
pub mod linux;

// Common platform interface
pub trait Platform {
    fn get_apps(&self) -> Vec<AppInfo>;
    fn launch_app(&self, app_id: &str) -> Result<(), String>;
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon: Option<String>,
}