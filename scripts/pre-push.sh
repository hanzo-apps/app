#!/bin/bash

# Pre-push validation script
# Run this before pushing to catch issues early

set -e

echo "🔍 Running pre-push validation..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    exit 1
fi

# 1. Lint check
echo -e "\n${YELLOW}1. Running linter...${NC}"
pnpm run lint > /dev/null 2>&1
print_status $? "Linting passed"

# 2. Type check
echo -e "\n${YELLOW}2. Running type check...${NC}"
pnpm exec tsc --noEmit > /dev/null 2>&1
print_status $? "Type checking passed"

# 3. Tests
echo -e "\n${YELLOW}3. Running tests...${NC}"
pnpm test > /dev/null 2>&1
print_status $? "All tests passed"

# 4. Build check
echo -e "\n${YELLOW}4. Checking build...${NC}"
echo "   (This might take a moment...)"
pnpm run build > /dev/null 2>&1
print_status $? "Build completed successfully"

echo -e "\n${GREEN}✨ All checks passed! Safe to push.${NC}"
echo ""
echo "To push your changes:"
echo "  git push origin $(git branch --show-current)"
echo ""
echo "GitHub Actions will run these checks again after push."