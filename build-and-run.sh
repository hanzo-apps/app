#!/bin/bash

echo "🚀 Building Hanzo app..."

cd "$(dirname "$0")"

# Kill any existing Metro bundler
pkill -f "react-native.*start" || true

# Start Metro bundler in background
echo "📦 Starting Metro bundler..."
npx react-native start --reset-cache > /dev/null 2>&1 &
METRO_PID=$!

# Wait for Metro to start
sleep 5

# Build the app
echo "🔨 Building macOS app..."
cd macos

# Clean previous builds
rm -rf ~/Library/Developer/Xcode/DerivedData/hanzo-*
rm -rf build

# Build with your Apple ID (sign to run locally)
xcodebuild -workspace hanzo.xcworkspace \
  -scheme macOS \
  -configuration Debug \
  -destination 'platform=macOS,arch=arm64' \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="" \
  -allowProvisioningUpdates \
  build

# Find the built app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Products/Debug -name "*.app" -type d | head -1)

if [ -d "$APP_PATH" ]; then
  echo "✅ Build successful!"
  
  # Copy to Applications
  echo "📱 Installing to Applications..."
  rm -rf /Applications/Hanzo.app
  cp -R "$APP_PATH" /Applications/Hanzo.app
  
  # Launch the app
  echo "🚀 Launching Hanzo..."
  open /Applications/Hanzo.app
  
  echo "✨ Hanzo is now running! Press Tab to access Hanzo Zen AI."
else
  echo "❌ Build failed. Trying alternative approach..."
  
  # Try with React Native CLI
  cd ..
  npx react-native run-macos --scheme macOS --mode Debug
fi

# Keep Metro running
wait $METRO_PID