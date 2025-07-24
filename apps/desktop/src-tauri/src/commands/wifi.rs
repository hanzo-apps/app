use tauri::command;
use qrcode::{QrCode, EcLevel};
use image::{ImageBuffer, Luma};
use base64::Engine;

#[command]
pub fn generate_wifi_qr(ssid: String, password: String) -> Result<String, String> {
    // Generate WiFi QR code in standard format
    let wifi_string = format!("WIFI:T:WPA;S:{};P:{};;", ssid, password);
    
    let code = QrCode::with_error_correction_level(&wifi_string, EcLevel::M)
        .map_err(|e| e.to_string())?;
    
    // Render to image
    let image = code.render::<Luma<u8>>()
        .min_dimensions(200, 200)
        .build();
    
    // Convert to base64
    let mut buffer = Vec::new();
    image::DynamicImage::ImageLuma8(image)
        .write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    
    let base64 = base64::engine::general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64))
}