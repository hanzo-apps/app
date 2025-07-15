#!/bin/bash

# Fix build script for Hanzo app
set -e

echo "🔧 Fixing Hanzo app build..."

# 1. Clean derived data
echo "🧹 Cleaning derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/hanzo-*
rm -rf ~/Library/Developer/Xcode/DerivedData/sol-*
rm -rf macos/build

# 2. Reset code signing
echo "🔑 Resetting code signing..."
defaults write com.apple.dt.Xcode IDEProvisioningTeamName "-"

# 3. Fix React Native codegen
echo "📦 Regenerating React Native codegen..."
cd macos
if [ -d "../node_modules/react-native-macos/scripts/react_native_pods_utils" ]; then
    ruby ../node_modules/react-native-macos/scripts/react_native_pods_utils/script_phases.rb generate-artifacts
fi
cd ..

# 4. Update pods
echo "🔄 Updating CocoaPods..."
cd macos
pod deintegrate
pod install --repo-update
cd ..

# 5. Fix Hermes
echo "🔧 Fixing Hermes configuration..."
cd macos
if [ -f "Pods/Target Support Files/hermes-engine/hermes-engine.debug.xcconfig" ]; then
    echo "EXCLUDED_ARCHS[sdk=iphonesimulator*] = " >> "Pods/Target Support Files/hermes-engine/hermes-engine.debug.xcconfig"
fi
cd ..

# 6. Build with xcodebuild
echo "🏗️ Building Hanzo app..."
cd macos
xcodebuild -workspace hanzo.xcworkspace \
    -scheme macOS \
    -configuration Debug \
    -destination 'platform=macOS,arch=arm64' \
    CODE_SIGN_IDENTITY="-" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    DEVELOPMENT_TEAM="" \
    -quiet build

echo "✅ Build complete!"

# 7. Find and install app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Products/Debug -name "Hanzo.app" -type d 2>/dev/null | head -1)
if [ -n "$APP_PATH" ]; then
    echo "📱 Found app at: $APP_PATH"
    rm -rf /Applications/Hanzo.app
    cp -R "$APP_PATH" /Applications/Hanzo.app
    echo "✅ Installed to /Applications/Hanzo.app"
    echo "🚀 Launching Hanzo..."
    open /Applications/Hanzo.app
else
    echo "❌ Could not find built app"
fi