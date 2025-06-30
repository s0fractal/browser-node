#!/bin/bash
# 🔐 Self-sign Browser Node for local use

echo "🔐 Self-signing Browser Node..."

APP_PATH="/Applications/Browser Node.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ Browser Node not found in Applications"
    exit 1
fi

# Remove quarantine
echo "📦 Removing quarantine attributes..."
xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null || true

# Create ad-hoc signature
echo "✍️ Creating ad-hoc signature..."
codesign --force --deep --sign - "$APP_PATH"

# Verify
echo "🔍 Verifying signature..."
codesign --verify --verbose "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Browser Node is now signed and ready!"
    echo "🚀 You can now open it normally"
else
    echo "❌ Signing failed. Try manual method:"
    echo "   sudo xattr -cr '$APP_PATH'"
fi