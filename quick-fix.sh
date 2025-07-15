#!/bin/bash

# Quick fix for Hanzo build
echo "🚀 Quick fix for Hanzo build..."

# Clean only what's necessary
echo "🧹 Cleaning build artifacts..."
rm -rf macos/build
rm -rf ~/Library/Developer/Xcode/DerivedData/hanzo-*

# Build with minimal options
echo "🏗️ Building..."
cd macos
xcodebuild -workspace hanzo.xcworkspace \
    -scheme macOS \
    -configuration Debug \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    -quiet \
    | grep -E "(error:|warning:|FAILED|SUCCEEDED)" || true

# Check for app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Products/Debug -name "Hanzo.app" 2>/dev/null | head -1)
if [ -n "$APP_PATH" ]; then
    echo "✅ Build succeeded! App at: $APP_PATH"
    cp -R "$APP_PATH" /Applications/Hanzo.app
    open /Applications/Hanzo.app
else
    echo "❌ Build failed. Trying alternate location..."
    if [ -d "build/Build/Products/Debug/Hanzo.app" ]; then
        cp -R "build/Build/Products/Debug/Hanzo.app" /Applications/Hanzo.app
        open /Applications/Hanzo.app
    else
        echo "❌ No app found"
    fi
fi