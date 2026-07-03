# Platform Support

Koan is designed to be a cross-platform app launcher with AI assistant. Here's the current platform support:

## ✅ Currently Supported

### macOS (Primary Platform)
- Native macOS app using React Native macOS
- Menu bar integration
- Global keyboard shortcuts
- Native window management
- Full feature support

### Windows
- UWP application
- Basic launcher functionality
- Limited feature support compared to macOS

## 🚧 Planned Support

### Mobile Platforms

#### iOS/iPadOS
- Will require React Native iOS setup
- Touch-optimized UI
- Widget support for quick access
- Siri Shortcuts integration for AI assistant

#### Android  
- Will require React Native Android setup
- Home screen widget
- Quick settings tile
- Voice assistant integration

### Desktop Platforms

#### Linux
- Electron or Tauri-based build
- Desktop entry integration
- Global shortcuts via X11/Wayland
- AppImage/Snap/Flatpak distribution

## Architecture Notes

The app uses React Native with platform-specific native modules. To add new platform support:

1. **Mobile (iOS/Android)**: Use standard React Native setup
2. **Linux**: Consider Electron wrapper or Tauri for better performance
3. **Web**: Progressive Web App with limited features

## AI Integration

The Hanzo Zen AI assistant will be available on all platforms with:
- Local inference support where possible
- Cloud fallback for mobile/web
- Platform-specific optimizations