#!/bin/bash

echo "Fixing all remaining TypeScript errors..."

# Fix social-feed template
sed -i 's/onChange={(e) =>/onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>/g' app/templates/social-feed/page.tsx

# Fix video-streaming template
sed -i 's/onChange={(e) =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' app/templates/video-streaming/page.tsx

# Fix dev-onboarding
sed -i 's/onChange={(e) =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' components/dev-onboarding/index.tsx
sed -i 's/onKeyDown={(e) =>/onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>/g' components/dev-onboarding/index.tsx

# Fix all onSubmit handlers
find app components -name "*.tsx" -exec sed -i 's/onSubmit={(e) =>/onSubmit={(e: React.FormEvent) =>/g' {} +

# Fix all Select onValueChange handlers
find app components -name "*.tsx" -exec sed -i 's/onValueChange={(value) =>/onValueChange={(value: string) =>/g' {} +

# Fix all Slider onValueChange handlers
find app components -name "*.tsx" -exec sed -i 's/onValueChange={(\[value\]) =>/onValueChange={([value]: number[]) =>/g' {} +

echo "Fixed common TypeScript patterns. Now fixing component-specific issues..."