#!/bin/bash

echo "Updating UI component imports to use @hanzo/ui..."

# Find all TypeScript/JavaScript files and update imports
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -exec sed -i '' 's|from ["'\'']@/components/ui/\([^"'\'']*\)["'\'']|from "@hanzo/ui"|g' {} +

# Update specific component imports that might have different patterns
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -exec sed -i '' 's|from ["'\'']@/components/ui["'\'']|from "@hanzo/ui"|g' {} +

# Update relative imports from components/ui
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -exec sed -i '' 's|from ["'\'']\.\.*/components/ui/\([^"'\'']*\)["'\'']|from "@hanzo/ui"|g' {} +

echo "Import updates completed!"
echo "Files updated:"
grep -r "@hanzo/ui" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next -l | head -20