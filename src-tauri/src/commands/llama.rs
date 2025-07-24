use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{State, Manager};

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size: u64,
    pub loaded: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GenerateOptions {
    pub temperature: Option<f32>,
    pub max_tokens: Option<i32>,
    pub top_p: Option<f32>,
    pub top_k: Option<i32>,
    pub repeat_penalty: Option<f32>,
    pub seed: Option<i32>,
}

pub struct LlamaState {
    pub model_path: Option<String>,
}

impl Default for LlamaState {
    fn default() -> Self {
        Self {
            model_path: None,
        }
    }
}

#[tauri::command]
pub async fn load_model(
    path: String,
    llama_state: State<'_, Arc<Mutex<LlamaState>>>,
) -> Result<String, String> {
    let mut state = llama_state.lock().await;
    
    // For now, just store the path
    // In a real implementation, we would load the model here
    state.model_path = Some(path.clone());
    
    Ok(format!("Model path set to: {}", path))
}

#[tauri::command]
pub async fn unload_model(
    llama_state: State<'_, Arc<Mutex<LlamaState>>>,
) -> Result<String, String> {
    let mut state = llama_state.lock().await;
    state.model_path = None;
    Ok("Model unloaded".to_string())
}

#[tauri::command]
pub async fn generate_text(
    prompt: String,
    options: Option<GenerateOptions>,
    llama_state: State<'_, Arc<Mutex<LlamaState>>>,
) -> Result<String, String> {
    let state = llama_state.lock().await;
    
    if let Some(_path) = &state.model_path {
        // For now, return a placeholder response
        // In a real implementation, we would use llama_cpp here
        let response = format!(
            "This is a placeholder response to: '{}'. The llama.cpp integration is being set up.",
            prompt
        );
        Ok(response)
    } else {
        Err("No model loaded".to_string())
    }
}

#[tauri::command]
pub async fn get_model_info(
    llama_state: State<'_, Arc<Mutex<LlamaState>>>,
) -> Result<Option<ModelInfo>, String> {
    let state = llama_state.lock().await;
    
    if let Some(path) = &state.model_path {
        // Get file size
        let metadata = std::fs::metadata(path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;
        
        Ok(Some(ModelInfo {
            id: "default".to_string(),
            name: path.split('/').last().unwrap_or("unknown").to_string(),
            path: path.clone(),
            size: metadata.len(),
            loaded: true,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn list_available_models(app_handle: tauri::AppHandle) -> Result<Vec<ModelInfo>, String> {
    let app_dir = app_handle.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let models_dir = app_dir.join("models");
    
    // Create models directory if it doesn't exist
    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir)
            .map_err(|e| format!("Failed to create models directory: {}", e))?;
    }
    
    let mut models = Vec::new();
    
    // List all .gguf files in the models directory
    if let Ok(entries) = std::fs::read_dir(&models_dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_file() {
                    let path = entry.path();
                    if let Some(ext) = path.extension() {
                        if ext == "gguf" || ext == "ggml" || ext == "bin" {
                            if let Ok(metadata) = entry.metadata() {
                                models.push(ModelInfo {
                                    id: path.file_stem()
                                        .and_then(|s| s.to_str())
                                        .unwrap_or("unknown")
                                        .to_string(),
                                    name: path.file_name()
                                        .and_then(|s| s.to_str())
                                        .unwrap_or("unknown")
                                        .to_string(),
                                    path: path.to_string_lossy().to_string(),
                                    size: metadata.len(),
                                    loaded: false,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Also check Downloads folder for convenience
    if let Some(home_dir) = dirs::home_dir() {
        let downloads_dir = home_dir.join("Downloads");
        if let Ok(entries) = std::fs::read_dir(&downloads_dir) {
            for entry in entries.flatten() {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_file() {
                        let path = entry.path();
                        if let Some(ext) = path.extension() {
                            if ext == "gguf" || ext == "ggml" || ext == "bin" {
                                if let Some(filename) = path.file_name() {
                                    if let Some(filename_str) = filename.to_str() {
                                        // Check if it looks like a model file
                                        if filename_str.contains("llama") || 
                                           filename_str.contains("mistral") || 
                                           filename_str.contains("phi") ||
                                           filename_str.contains("qwen") ||
                                           filename_str.contains("gemma") {
                                            if let Ok(metadata) = entry.metadata() {
                                                models.push(ModelInfo {
                                                    id: path.file_stem()
                                                        .and_then(|s| s.to_str())
                                                        .unwrap_or("unknown")
                                                        .to_string(),
                                                    name: filename_str.to_string(),
                                                    path: path.to_string_lossy().to_string(),
                                                    size: metadata.len(),
                                                    loaded: false,
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(models)
}