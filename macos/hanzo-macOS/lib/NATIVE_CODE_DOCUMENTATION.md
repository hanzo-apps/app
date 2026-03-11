# Hanzo macOS Native Code Documentation

## Overview

The Hanzo macOS app contains a comprehensive set of native Swift and Objective-C implementations that provide deep system integration capabilities. This codebase leverages macOS APIs to offer functionality ranging from window management to system accessibility features.

## Architecture

The native code is structured as follows:
- **Swift Classes**: Main business logic and system integration
- **Objective-C/C++ Bridge**: JSI bindings for React Native integration
- **React Native Event Emitter**: Communication layer between native and JavaScript

## Core Components

### 1. HanzoNative.swift (Main Native Module)
**Purpose**: Central React Native module that exposes native functionality to JavaScript

**Key Features**:
- Application management (launch, quit, file operations)
- Window management integration
- System preferences (dark mode, DND)
- Accessibility API access
- Media playback information
- Clipboard operations
- Keychain secure storage
- Safari bookmarks access
- WiFi QR code generation
- Hotkey management
- Toast notifications

**Exposed Methods**:
- `getApps()` - Returns all installed applications
- `openFile(path)` - Opens files with default application
- `toggleDarkMode()` - Toggles system dark mode
- `executeAppleScript(source)` - Runs AppleScript
- `executeBashScript(source)` - Runs shell commands
- `getMediaInfo()` - Gets current media playback info
- `setGlobalShortcut(key)` - Sets global keyboard shortcuts
- `requestAccessibilityAccess()` - Requests accessibility permissions
- Window resizing methods (half, quarter, fullscreen positions)
- `pasteToFrontmostApp(content)` - Simulates paste operation
- `securelyStore/Retrieve()` - Keychain access
- `showToast()` - Native toast notifications

### 2. WindowManager.swift
**Purpose**: Advanced window management with intelligent positioning

**Key Features**:
- Window snapping to screen halves/quarters
- Multi-monitor support with screen detection
- Intelligent window resizing with memory of last actions
- Smooth transitions between different window states
- Support for thirds and two-thirds positioning

**Smart Behaviors**:
- Cycles through half → third → two-thirds when repeatedly snapping
- Maintains window state history per application
- Handles screen boundary detection
- Normalizes coordinates across multiple displays

### 3. AccessibilityElement.swift
**Purpose**: Low-level accessibility API wrapper for window manipulation

**Key Features**:
- Direct window manipulation via Accessibility APIs
- Window identification and tracking
- Position and size adjustments
- Multi-window application support
- Private API usage for enhanced functionality (_AXUIElementGetWindow)

**Technical Details**:
- Uses AXUIElement for window access
- Handles enhanced user interface mode
- Provides coordinate normalization
- Window identification fallback mechanisms

### 4. ApplicationSearcher.swift
**Purpose**: Discovers and indexes all installed macOS applications

**Key Features**:
- Searches multiple application directories (system, user, local)
- Handles application aliases
- Tracks running application state
- Error handling with Sentry integration
- Recursive directory searching with depth limits

### 5. JSIBindings.mm/hpp
**Purpose**: JavaScript Interface (JSI) bridge for high-performance native calls

**Key Features**:
- Direct JavaScript runtime integration
- Synchronous native function calls
- Promise-based async operations
- File system operations
- Calendar integration
- WiFi information access
- Process management

**JSI Functions**:
- `setHeight()` - Window height adjustment
- `hideWindow()/showWindow()` - Window visibility
- `searchFiles()` - Native file search
- `getEvents()` - Calendar event access
- `getWifiPassword()` - WiFi credential retrieval
- `ps()/killProcess()` - Process management

### 6. ClipboardHelper.swift
**Purpose**: Advanced clipboard and text insertion functionality

**Key Features**:
- Clipboard monitoring with app tracking
- Paste simulation via CGEvent
- Direct text insertion without clipboard
- Frontmost application detection

### 7. MediaHelper.swift
**Purpose**: Media playback information retrieval

**Key Features**:
- Uses private MediaRemote framework
- Retrieves current playing media info
- Extracts artwork data as base64
- Identifies source application

### 8. CalendarHelper.mm
**Purpose**: EventKit integration for calendar access

**Key Features**:
- Calendar permission handling
- Event retrieval with 30-day window
- Support for macOS 14+ full access API
- Event filtering and participant status

### 9. FileSearch.mm
**Purpose**: High-performance file search with fuzzy matching

**Key Features**:
- Recursive directory traversal
- Fuzzy string matching using NSString+Score
- Folder and file differentiation
- Optimized C++ implementation

### 10. ScreenDetector.swift
**Purpose**: Multi-monitor configuration detection

**Key Features**:
- Screen arrangement detection
- Adjacent screen identification
- Window-to-screen assignment
- Percentage-based screen containment

### 11. Additional Utilities

**ShellHelper.swift**: Shell command execution wrapper
**DarkMode.swift**: System dark mode toggle via AppleScript
**DoNotDisturb.swift**: DND mode management
**NotchHelper.swift**: MacBook notch handling
**QRGenerator.swift**: WiFi QR code generation
**KeychainAccess.swift**: Secure credential storage
**HanzoEmitter.swift**: Event emission to JavaScript
**AppleScriptHelper.swift**: AppleScript execution wrapper
**BookmarkHelper.swift**: Safari bookmark access
**MouseUtils.swift**: Mouse interaction utilities
**MediaKeyForwarder.m**: Media key event forwarding

## Dependencies

### External Libraries
- **HotKey**: Global hotkey management
- **LaunchAtLogin**: Startup item management
- **Sentry**: Error tracking and monitoring
- **KeychainAccess**: Keychain wrapper

### System Frameworks
- **Cocoa/AppKit**: Core macOS UI framework
- **EventKit**: Calendar access
- **CoreWLAN**: WiFi information
- **CoreLocation**: Location services
- **MediaRemote**: Private media playback framework
- **Accessibility**: Window manipulation

## Permissions Required
1. **Accessibility**: Window management, global hotkeys
2. **Calendar**: Event access
3. **Location**: WiFi network information
4. **Full Disk Access**: Safari bookmarks, file system

## Code Quality Assessment

### Strengths
- Well-structured with clear separation of concerns
- Comprehensive error handling
- Good use of Swift/ObjC interop
- Extensive system integration
- Performance optimizations (JSI, C++)

### Areas for Improvement
- Heavy reliance on private APIs (MediaRemote)
- Some commented-out code (processes.mm)
- Mixed Swift/ObjC could be modernized
- Some force-unwrapping in Swift code

### Security Considerations
- Keychain integration for secure storage
- Proper permission requests
- No obvious security vulnerabilities
- Careful handling of system-level access

## Migration Recommendations

For migration to the neo project:

1. **Modernize Architecture**
   - Consider pure Swift implementation where possible
   - Update deprecated APIs
   - Remove private API dependencies

2. **Enhance Type Safety**
   - Add more Swift type annotations
   - Reduce force unwrapping
   - Use Result types for error handling

3. **Improve Modularity**
   - Break down large classes
   - Create protocol-based abstractions
   - Separate concerns more clearly

4. **Add Testing**
   - Unit tests for core functionality
   - Integration tests for system APIs
   - Mock system dependencies

5. **Documentation**
   - Add inline code documentation
   - Create API reference
   - Document permission requirements

## Conclusion

The Hanzo macOS native code represents a mature, feature-rich implementation with deep system integration. While the code quality is generally good, there are opportunities for modernization and improvement, particularly around type safety, testing, and reducing private API usage. The architecture is sound and provides a solid foundation for the neo project migration.