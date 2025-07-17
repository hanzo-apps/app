use parking_lot::RwLock;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::commands::Settings;
use crate::search::SearchIndex;

pub struct AppState {
    pub settings: Arc<RwLock<Settings>>,
    pub search_index: Arc<Mutex<SearchIndex>>,
    pub clipboard_history: Arc<Mutex<Vec<String>>>,
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
            search_index: Arc::new(Mutex::new(SearchIndex::new())),
            clipboard_history: Arc::new(Mutex::new(Vec::new())),
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