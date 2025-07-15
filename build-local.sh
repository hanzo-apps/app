#!/bin/bash

# Build Hanzo app locally without code signing

echo "Building Hanzo app..."

cd macos

# Clean build folder
rm -rf build

# Build with ad-hoc signing
xcodebuild -workspace hanzo.xcworkspace \
  -scheme macOS \
  -configuration Debug \
  -derivedDataPath build \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=YES \
  AD_HOC_CODE_SIGNING_ALLOWED=YES \
  DEVELOPMENT_TEAM="" \
  PROVISIONING_PROFILE_SPECIFIER=""

# Copy to Applications if successful
if [ -d "build/Build/Products/Debug/macOS.app" ]; then
  echo "Build successful! Installing to /Applications/Hanzo.app"
  rm -rf /Applications/Hanzo.app
  cp -R build/Build/Products/Debug/macOS.app /Applications/Hanzo.app
  echo "Launching Hanzo..."
  open /Applications/Hanzo.app
else
  echo "Build failed. Please check the errors above."
fi