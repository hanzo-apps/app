#!/bin/bash

echo "Fixing code signing issues..."

cd "$(dirname "$0")/macos"

# Update project settings to disable code signing
sed -i '' 's/CODE_SIGN_IDENTITY = "Apple Development";/CODE_SIGN_IDENTITY = "";/g' sol.xcodeproj/project.pbxproj
sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g' sol.xcodeproj/project.pbxproj
sed -i '' 's/"CODE_SIGN_IDENTITY\[sdk=macosx\*\]" = "Apple Development";/"CODE_SIGN_IDENTITY[sdk=macosx*]" = "";/g' sol.xcodeproj/project.pbxproj
sed -i '' 's/ENABLE_HARDENED_RUNTIME = YES;/ENABLE_HARDENED_RUNTIME = NO;/g' sol.xcodeproj/project.pbxproj

# Create a simple entitlements file without hardened runtime requirements
cat > sol-macOS/sol-macOS-nosign.entitlements << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
</dict>
</plist>
EOF

# Update entitlements reference
sed -i '' 's/sol-macOS\/sol-macOS.entitlements/sol-macOS\/sol-macOS-nosign.entitlements/g' sol.xcodeproj/project.pbxproj

echo "Code signing disabled!"