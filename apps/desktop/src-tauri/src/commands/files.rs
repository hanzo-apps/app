use tauri::command;
use std::path::Path;

#[command]
pub fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        Command::new("cmd")
            .args(&["/c", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[command]
pub fn open_with_finder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // On other platforms, just open the parent directory
        if let Some(parent) = Path::new(&path).parent() {
            open_file(parent.to_string_lossy().to_string())
        } else {
            Err("Cannot find parent directory".to_string())
        }
    }
}

#[command]
pub fn search_files(query: String, directory: String) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::PathBuf;
    
    fn search_recursive(dir: &Path, query: &str, results: &mut Vec<String>) -> std::io::Result<()> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                if let Some(file_name) = path.file_name() {
                    if file_name.to_string_lossy().to_lowercase().contains(&query.to_lowercase()) {
                        results.push(path.to_string_lossy().to_string());
                    }
                }
                
                if path.is_dir() && !path.to_string_lossy().contains("/.") {
                    let _ = search_recursive(&path, query, results);
                }
            }
        }
        Ok(())
    }
    
    let mut results = Vec::new();
    let search_path = PathBuf::from(directory);
    
    search_recursive(&search_path, &query, &mut results)
        .map_err(|e| e.to_string())?;
    
    Ok(results)
}