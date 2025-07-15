use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::commands::Settings;

pub struct AppState {
    settings: Arc<RwLock<Settings>>,
}

impl AppState {
    pub fn new() -> Self {
        let default_settings = Settings {
            theme: "dark".to_string(),
            hotkey_launcher: "Cmd+Space".to_string(),
            hotkey_ai: "Tab".to_string(),
            ai_model: "gpt-4".to_string(),
            ai_api_key: None,
        };
        
        Self {
            settings: Arc::new(RwLock::new(default_settings)),
        }
    }
    
    pub async fn get_settings(&self) -> Result<Settings, String> {
        Ok(self.settings.read().clone())
    }
    
    pub async fn save_settings(&self, settings: Settings) -> Result<(), String> {
        *self.settings.write() = settings;
        // TODO: Persist to disk
        Ok(())
    }
}

impl Clone for Settings {
    fn clone(&self) -> Self {
        Self {
            theme: self.theme.clone(),
            hotkey_launcher: self.hotkey_launcher.clone(),
            hotkey_ai: self.hotkey_ai.clone(),
            ai_model: self.ai_model.clone(),
            ai_api_key: self.ai_api_key.clone(),
        }
    }
}