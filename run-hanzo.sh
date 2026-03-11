#!/bin/bash

# Kill any existing Hanzo app instances
pkill -f "hanzo.app" || true

# Build the app
echo "Building Hanzo app..."
npm run build

# Copy the app bundle to Applications for testing
echo "Installing to /Applications..."
rm -rf /Applications/Hanzo.app
cp -R src-tauri/target/release/bundle/macos/hanzo.app /Applications/Hanzo.app

# Launch the app
echo "Launching Hanzo..."
open /Applications/Hanzo.app

echo "Hanzo app launched!"