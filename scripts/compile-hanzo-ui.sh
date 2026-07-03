#!/bin/bash

# Pre-compile @hanzo/ui TypeScript to JavaScript
echo "Pre-compiling @hanzo/ui package..."

cd node_modules/@hanzo/ui

# Install TypeScript if not present
if ! command -v tsc &> /dev/null; then
    npm install -g typescript
fi

# Create a tsconfig for compilation
cat > tsconfig.build.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": false,
    "outDir": "./",
    "rootDir": "./",
    "removeComments": false,
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": false,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "allowJs": true,
    "noEmit": false
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "build"]
}
EOF

# Use SWC to compile TypeScript files
echo "Compiling TypeScript files with SWC..."
npx @swc/cli ./primitives ./blocks ./components ./assets ./types ./util ./src -d . --config-file false --copy-files

# Clean up
rm tsconfig.build.json

echo "Compilation complete!"