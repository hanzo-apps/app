#!/bin/bash

echo "Fixing all remaining TypeScript errors..."

# Fix all onChange handlers for inputs
find components -name "*.tsx" -exec sed -i 's/onChange={(e) =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' {} +

# Fix all onChange handlers for textareas
find components -name "*.tsx" -exec sed -i 's/onChange={(e) => set/onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set/g' {} +

# Fix all onBlur handlers
find components -name "*.tsx" -exec sed -i 's/onBlur={(e) =>/onBlur={(e: React.FocusEvent<HTMLInputElement>) =>/g' {} +

# Fix all onKeyDown handlers
find components -name "*.tsx" -exec sed -i 's/onKeyDown={(e) =>/onKeyDown={(e: React.KeyboardEvent) =>/g' {} +

# Fix all onSubmit handlers
find components -name "*.tsx" -exec sed -i 's/onSubmit={(e) =>/onSubmit={(e: React.FormEvent) =>/g' {} +

# Fix Select onValueChange
find components -name "*.tsx" -exec sed -i 's/onValueChange={(value) =>/onValueChange={(value: string) =>/g' {} +

echo "TypeScript fixes applied!"
