use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::thread;
use walkdir::{WalkDir, DirEntry};
use fuzzy_matcher::FuzzyMatcher;
use fuzzy_matcher::skim::SkimMatcherV2;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use dirs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub path: String,
    pub name: String,
    pub kind: String,
    pub size: u64,
    pub modified: u64,
    pub score: f64,
}

pub struct FileSearcher {
    matcher: SkimMatcherV2,
    default_paths: Vec<PathBuf>,
}

impl FileSearcher {
    pub fn new() -> Self {
        let username = whoami::username();
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"));
        
        // Default search paths matching Sol
        let default_paths = vec![
            home.join("Downloads"),
            home.join("Documents"),
            home.join("Desktop"),
            home.join("Pictures"),
            home.join("Movies"),
            home.join("Music"),
        ];

        Self {
            matcher: SkimMatcherV2::default(),
            default_paths,
        }
    }

    pub fn search(&self, query: &str, custom_paths: Option<Vec<String>>) -> Vec<FileSearchResult> {
        let search_paths = if let Some(paths) = custom_paths {
            paths.into_iter()
                .map(PathBuf::from)
                .filter(|p| p.exists())
                .collect()
        } else {
            self.default_paths.clone()
        };

        let (tx, rx) = mpsc::channel();
        let query = query.to_lowercase();
        let query_clone = query.clone();

        // Spawn threads for parallel search
        for path in search_paths {
            let tx = tx.clone();
            let query = query_clone.clone();
            let matcher = self.matcher.clone();
            
            thread::spawn(move || {
                search_directory(&path, &query, &matcher, &tx);
            });
        }

        drop(tx); // Close sender

        // Collect and sort results
        let mut results: Vec<FileSearchResult> = rx.into_iter().collect();
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        
        // Limit results
        results.truncate(50);
        results
    }
}

fn search_directory(
    path: &Path,
    query: &str,
    matcher: &SkimMatcherV2,
    tx: &mpsc::Sender<FileSearchResult>,
) {
    let walker = WalkDir::new(path)
        .max_depth(5)
        .follow_links(false);

    for entry in walker.into_iter().filter_map(|e| e.ok()) {
        if should_skip_entry(&entry) {
            continue;
        }

        let file_name = entry.file_name().to_string_lossy();
        
        // Score based on fuzzy match
        if let Some(score) = matcher.fuzzy_match(&file_name.to_lowercase(), query) {
            if score > 20 { // Threshold for relevance
                let metadata = match entry.metadata() {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                let result = FileSearchResult {
                    path: entry.path().to_string_lossy().to_string(),
                    name: file_name.to_string(),
                    kind: if metadata.is_dir() { "folder" } else { "file" }.to_string(),
                    size: metadata.len(),
                    modified: metadata.modified()
                        .unwrap_or(SystemTime::UNIX_EPOCH)
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs(),
                    score: score as f64,
                };

                let _ = tx.send(result);
            }
        }
    }
}

fn should_skip_entry(entry: &DirEntry) -> bool {
    let name = entry.file_name().to_string_lossy();
    
    // Skip hidden files and system directories
    name.starts_with('.') ||
    name == "node_modules" ||
    name == "target" ||
    name == ".git" ||
    name == "Library" ||
    name == "Application Support"
}

// Tauri command implementation
#[tauri::command]
pub async fn search_files_real(query: String, paths: Option<Vec<String>>) -> Result<Vec<FileSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let searcher = FileSearcher::new();
    Ok(searcher.search(&query, paths))
}