#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Fixing TypeScript errors in the codebase...');

// Pattern to fix onChange handlers without types
const fixOnChangeHandlers = (content) => {
  // Fix onChange={(e) => patterns
  content = content.replace(
    /onChange=\{(\(e\)) =>/g,
    'onChange={(e: React.ChangeEvent<HTMLInputElement>)  =>'
  );

  // Fix onChange={({ value }) => patterns
  content = content.replace(
    /onChange=\{(\({ value }\)) =>/g,
    'onChange={({ value }: { value: string }) =>'
  );

  return content;
};

// Pattern to fix onSubmit handlers without types
const fixOnSubmitHandlers = (content) => {
  // Fix onSubmit={(e) => patterns
  content = content.replace(
    /onSubmit=\{(\(e\)) =>/g,
    'onSubmit={(e: React.FormEvent) =>'
  );

  return content;
};

// Pattern to fix value parameter without types
const fixValueParameters = (content) => {
  // Fix (value) => patterns in specific contexts
  content = content.replace(
    /onValueChange=\{(\(value\)) =>/g,
    'onValueChange={(value: string) =>'
  );

  return content;
};

// Files to process
const filesToFix = [
  'app/billing/page.tsx',
  'app/chat/page.tsx',
  'app/docs/page.tsx',
  'app/gallery/page.tsx',
  'app/integrations/page.tsx',
  'app/new/page.tsx',
  'app/nodes/page.tsx',
  'app/playground/page.tsx',
  'app/templates/ai-chat-interface/page.tsx',
  'app/templates/blog-platform/page.tsx',
  'app/templates/kanban-board/page.tsx',
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = fixOnChangeHandlers(content);
    content = fixOnSubmitHandlers(content);
    content = fixValueParameters(content);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${file}`);
    }
  }
});

console.log('TypeScript error fixes applied!');