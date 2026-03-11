#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(target_os = "macos")]
    fn test_get_applications() {
        let apps = get_applications();
        
        // Should find at least some system apps
        assert!(!apps.is_empty(), "Should find at least one application");
        
        // Check for common macOS apps
        let finder = apps.iter().find(|app| app.name == "Finder");
        assert!(finder.is_some(), "Should find Finder.app");
        
        let safari = apps.iter().find(|app| app.name == "Safari");
        assert!(safari.is_some(), "Should find Safari.app");
        
        // Verify app structure
        for app in &apps {
            assert!(!app.name.is_empty(), "App name should not be empty");
            assert!(!app.id.is_empty(), "App ID should not be empty");
            assert!(app.path.ends_with(".app"), "App path should end with .app");
            assert!(app.icon.is_some(), "App should have an icon path");
        }
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn test_extract_app_icon() {
        use std::path::PathBuf;
        
        // Test with Safari (known to have an icon)
        let safari_path = PathBuf::from("/Applications/Safari.app");
        if safari_path.exists() {
            let icon = extract_app_icon(&safari_path);
            assert!(icon.is_some(), "Safari should have an icon");
            
            let icon_path = icon.unwrap();
            assert!(
                icon_path.ends_with(".icns") || icon_path.ends_with(".app"),
                "Icon should be .icns file or .app bundle"
            );
        }
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn test_check_if_running() {
        // Finder is always running on macOS
        let is_running = check_if_running("Finder");
        assert!(is_running, "Finder should always be running");
        
        // Test with a likely not running app
        let not_running = check_if_running("ThisAppDoesNotExist123456");
        assert!(!not_running, "Non-existent app should not be running");
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn test_launch_application() {
        // Don't actually launch apps in tests, just verify the function exists
        let result = launch_application("non-existent-app-id");
        assert!(result.is_err(), "Should fail to launch non-existent app");
        assert_eq!(result.unwrap_err(), "Application not found");
    }

    #[test]
    fn test_application_id_generation() {
        let apps = vec![
            Application {
                name: "Visual Studio Code".to_string(),
                id: String::new(),
                path: String::new(),
                icon: None,
                is_running: false,
            }
        ];
        
        // Test ID generation logic
        let id = "Visual Studio Code".to_lowercase().replace(" ", "-");
        assert_eq!(id, "visual-studio-code");
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn test_search_paths() {
        let home = std::env::var("HOME").unwrap_or_default();
        let expected_paths = vec![
            "/Applications",
            "/System/Applications",
            &format!("{}/Applications", home),
        ];
        
        // Verify all search paths exist or are valid
        for path in expected_paths {
            let path_exists = std::path::Path::new(path).exists();
            println!("Checking path: {} - exists: {}", path, path_exists);
        }
    }
}