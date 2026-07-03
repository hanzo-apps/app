# Hanzo Cross-Platform Setup Guide

## Architecture Overview

Hanzo is a React Native application that will support:
- macOS (current)
- iOS (iPhone & iPad)
- Android
- Windows
- Linux (via Electron wrapper)

## Platform Status

### ✅ macOS
- Already configured with React Native macOS
- Uses native macOS features (hotkeys, menu bar)

### 🔄 iOS/iPadOS
- Needs react-native-ios setup
- Will share most code with macOS
- Different UI paradigm (no hotkeys, touch-based)

### 🔄 Android
- Needs Android Studio setup
- Will use React Native standard Android support

### 🔄 Windows
- Will use React Native Windows
- Similar desktop experience to macOS

### 🔄 Linux
- No official React Native support
- Options: Electron wrapper or React Native Web

## Immediate Actions Needed

1. Fix current build issues
2. Update dependencies
3. Add iOS configuration
4. Add Android configuration
5. Create platform-specific code structure

## Code Structure

```
src/
  components/
    common/          # Shared components
    desktop/         # macOS/Windows/Linux
    mobile/          # iOS/Android
  services/
    platform/        # Platform-specific implementations
  screens/
    common/
    desktop/
    mobile/
```