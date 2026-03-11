use tauri::command;
use log::info;

#[command]
pub fn speak_text(text: String, voice: Option<String>, rate: Option<f32>) -> Result<(), String> {
    info!("Speaking text: {} chars", text.len());
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let mut args = vec![];
        
        // Add voice if specified
        if let Some(voice_name) = voice {
            args.push("-v".to_string());
            args.push(voice_name);
        }
        
        // Add rate if specified (120-300 words per minute, default ~200)
        if let Some(speech_rate) = rate {
            args.push("-r".to_string());
            args.push((speech_rate * 200.0).to_string());
        }
        
        args.push(text);
        
        Command::new("say")
            .args(&args)
            .spawn()
            .map_err(|e| e.to_string())?;
            
        Ok(())
    }
    
    #[cfg(target_os = "windows")]
    {
        // Use Windows SAPI
        use std::process::Command;
        
        let script = format!(
            r#"Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak("{}")"#,
            text.replace("\"", "\\\"")
        );
        
        Command::new("powershell")
            .args(&["-Command", &script])
            .spawn()
            .map_err(|e| e.to_string())?;
            
        Ok(())
    }
    
    #[cfg(target_os = "linux")]
    {
        // Use espeak or festival
        use std::process::Command;
        
        // Try espeak first
        if Command::new("which").arg("espeak").output().is_ok() {
            let mut cmd = Command::new("espeak");
            
            if let Some(speech_rate) = rate {
                cmd.arg("-s").arg((speech_rate * 175.0).to_string());
            }
            
            cmd.arg(&text)
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            return Err("No TTS engine found. Please install espeak.".to_string());
        }
        
        Ok(())
    }
}

#[command]
pub fn stop_speaking() -> Result<(), String> {
    info!("Stopping speech");
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("pkill")
            .arg("-f")
            .arg("say")
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows SAPI doesn't have a simple stop command
        // Would need more complex implementation
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("pkill")
            .arg("-f")
            .arg("espeak")
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub fn get_available_voices() -> Result<Vec<String>, String> {
    info!("Getting available voices");
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("say")
            .arg("-v")
            .arg("?")
            .output()
            .map_err(|e| e.to_string())?;
            
        let voices_text = String::from_utf8_lossy(&output.stdout);
        let voices: Vec<String> = voices_text
            .lines()
            .filter_map(|line| {
                // Format: "Agnes               en_US    # Isn't it nice to have a computer that will talk to you?"
                line.split_whitespace().next().map(|s| s.to_string())
            })
            .collect();
            
        Ok(voices)
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(vec!["default".to_string()])
    }
}

// Fun examples
#[command]
pub fn voice_demo_hello() -> Result<(), String> {
    info!("Running voice hello demo");
    
    let messages = vec![
        "Hello! I am Hanzo AI, your intelligent desktop assistant.",
        "I can see your screen, control your mouse and keyboard, and help you with any task.",
        "With my voice capabilities, I can now speak to you as well!",
        "Let's build something amazing together!"
    ];
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        use std::thread;
        use std::time::Duration;
        
        for (i, msg) in messages.iter().enumerate() {
            if i > 0 {
                thread::sleep(Duration::from_millis(500));
            }
            
            Command::new("say")
                .arg("-v")
                .arg("Samantha") // Use a nice voice
                .arg(msg)
                .spawn()
                .map_err(|e| e.to_string())?;
                
            // Wait for speech to complete (rough estimate)
            thread::sleep(Duration::from_secs(3));
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        speak_text(messages.join(" "), None, None)?;
    }
    
    Ok(())
}

#[command]
pub fn voice_demo_dramatic() -> Result<(), String> {
    info!("Running dramatic voice demo");
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Use a dramatic voice with slow rate
        Command::new("say")
            .args(&[
                "-v", "Daniel",
                "-r", "120",
                "I... am... inevitable. With great power comes great responsibility. And I have the power to control your entire computer."
            ])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        speak_text(
            "I am inevitable. With great power comes great responsibility. And I have the power to control your entire computer.".to_string(),
            None,
            Some(0.7)
        )?;
    }
    
    Ok(())
}