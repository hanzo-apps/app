#!/bin/bash

echo "🚀 Building Hanzo app..."

# Clean only specific dirs
rm -rf ~/Library/Developer/Xcode/DerivedData/hanzo-*

# Build
cd macos
xcodebuild -workspace hanzo.xcworkspace \
    -scheme macOS \
    -configuration Debug \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    DEVELOPMENT_TEAM="" \
    -allowProvisioningUpdates \
    -quiet build

# Find app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Products/Debug -name "Hanzo.app" 2>/dev/null | head -1)

if [ -n "$APP_PATH" ] && [ -f "$APP_PATH/Contents/MacOS/Hanzo" ]; then
    echo "✅ Build succeeded!"
    echo "📁 App at: $APP_PATH"
    
    # Install
    rm -rf /Applications/Hanzo.app
    cp -R "$APP_PATH" /Applications/Hanzo.app
    echo "✅ Installed to /Applications/Hanzo.app"
    
    # Launch
    open /Applications/Hanzo.app
else
    echo "❌ Build failed or app incomplete"
fi