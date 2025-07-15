#!/bin/bash

echo "🚀 Fixing and running Hanzo app..."

# Find the built app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Products/Debug -name "Hanzo.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ No built app found. Please build in Xcode first."
    exit 1
fi

echo "✅ Found app at: $APP_PATH"

# Check if executable exists
if [ ! -f "$APP_PATH/Contents/MacOS/Hanzo" ]; then
    echo "❌ Executable not found in app bundle"
    
    # Try to find the executable
    EXEC_PATH=$(find ~/Library/Developer/Xcode/DerivedData/hanzo-*/Build/Intermediates.noindex -name "Hanzo" -type f -perm +111 2>/dev/null | head -1)
    
    if [ -n "$EXEC_PATH" ]; then
        echo "✅ Found executable at: $EXEC_PATH"
        cp "$EXEC_PATH" "$APP_PATH/Contents/MacOS/Hanzo"
    else
        echo "❌ Could not find executable"
        exit 1
    fi
fi

# Copy to Applications
echo "📱 Installing to /Applications..."
rm -rf /Applications/Hanzo.app
cp -R "$APP_PATH" /Applications/Hanzo.app

# Fix Sparkle framework if needed
if [ -d "/Applications/Hanzo.app/Contents/Frameworks/Sparkle.framework" ]; then
    echo "🔧 Fixing Sparkle framework..."
    cd /Applications/Hanzo.app/Contents/Frameworks/Sparkle.framework/Versions
    if [ ! -L "B" ] && [ -d "A" ]; then
        ln -s A B
    fi
fi

# Launch the app
echo "🚀 Launching Hanzo..."
open /Applications/Hanzo.app

echo "✨ Done! Press Tab to access Hanzo Zen AI assistant."