#!/bin/bash

# Setup GitHub Secrets for CI/CD
# Usage: ./scripts/setup-github-secrets.sh

set -e

echo "🔐 GitHub Secrets Setup for Hanzo AI"
echo "======================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub."
    echo "   Run: gh auth login"
    exit 1
fi

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local name=$1
    local prompt=$2
    local required=$3

    echo -n "$prompt"
    if [ "$required" = "required" ]; then
        echo -n " (required): "
    else
        echo -n " (optional, press enter to skip): "
    fi

    read -s value
    echo ""

    if [ ! -z "$value" ]; then
        echo "$value" | gh secret set "$name" --repo="$REPO"
        echo "✅ Set $name"
    elif [ "$required" = "required" ]; then
        echo "❌ $name is required!"
        exit 1
    else
        echo "⏭️  Skipped $name"
    fi
}

echo "🔧 Setting up required secrets..."
echo ""

# Required secrets
set_secret "DOKPLOY_WEBHOOK_URL" "Enter Dokploy webhook URL" "required"

echo ""
echo "🔧 Setting up optional secrets..."
echo ""

# Optional secrets
set_secret "DISCORD_WEBHOOK_URL" "Enter Discord webhook URL for notifications" "optional"
set_secret "SLACK_WEBHOOK_URL" "Enter Slack webhook URL for notifications" "optional"
set_secret "NEXT_PUBLIC_API_URL" "Enter production API URL (e.g., https://hanzo.ai)" "optional"

echo ""
echo "✅ GitHub Secrets setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Verify secrets at: https://github.com/$REPO/settings/secrets/actions"
echo "2. Push to main branch to trigger deployment"
echo "3. Monitor deployment at: https://github.com/$REPO/actions"
echo ""
echo "🚀 Happy deploying!"