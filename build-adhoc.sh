#!/bin/bash

echo "🚀 Building Hanzo with ad-hoc signing..."

cd "$(dirname "$0")"

# Kill any existing processes
pkill -f "react-native.*start" || true
pkill -f "macOS.app" || true

# Start Metro bundler
echo "📦 Starting Metro bundler..."
npx react-native start --reset-cache > /dev/null 2>&1 &
METRO_PID=$!
sleep 5

cd macos

# Update project to use ad-hoc signing
echo "🔧 Configuring ad-hoc signing..."
sed -i '' 's/CODE_SIGN_IDENTITY = "";/CODE_SIGN_IDENTITY = "-";/g' hanzo.xcodeproj/project.pbxproj
sed -i '' 's/"CODE_SIGN_IDENTITY\[sdk=macosx\*\]" = "";/"CODE_SIGN_IDENTITY[sdk=macosx*]" = "-";/g' hanzo.xcodeproj/project.pbxproj

# Clean and build
echo "🔨 Building app..."
xcodebuild clean -workspace hanzo.xcworkspace -scheme macOS -quiet
xcodebuild build \
  -workspace hanzo.xcworkspace \
  -scheme macOS \
  -configuration Debug \
  -destination 'platform=macOS,arch=arm64' \
  CODE_SIGN_IDENTITY="-" \
  AD_HOC_CODE_SIGNING_ALLOWED=YES \
  DEVELOPMENT_TEAM="" \
  -quiet

# Find the built app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Products/Debug -name "*.app" -type d 2>/dev/null | head -1)

if [ -d "$APP_PATH" ]; then
  echo "✅ Build successful!"
  
  # Copy to Applications
  echo "📱 Installing as Hanzo.app..."
  rm -rf /Applications/Hanzo.app
  cp -R "$APP_PATH" /Applications/Hanzo.app
  
  # Launch
  echo "🚀 Launching Hanzo..."
  open /Applications/Hanzo.app
  
  echo ""
  echo "✨ Hanzo is running!"
  echo "📌 Press Tab to access Hanzo Zen AI assistant"
else
  echo "❌ Build failed. Check Xcode for details."
fi

# Keep script running to maintain Metro bundler
wait $METRO_PID