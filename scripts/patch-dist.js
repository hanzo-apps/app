#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Patching @hanzo/ui dist files to fix missing dependencies...');

// Find all @hanzo/ui locations in pnpm
const findHanzoPaths = () => {
  const paths = [];
  try {
    // List all @hanzo+ui directories in .pnpm
    const pnpmPath = path.join(__dirname, '../node_modules/.pnpm');
    if (fs.existsSync(pnpmPath)) {
      const dirs = fs.readdirSync(pnpmPath);
      const hanzoDirs = dirs.filter(d => d.startsWith('@hanzo+ui@'));
      hanzoDirs.forEach(hanzoDir => {
        const fullPath = path.join(pnpmPath, hanzoDir, 'node_modules/@hanzo/ui');
        if (fs.existsSync(fullPath)) {
          paths.push(fullPath);
        }
      });
    }
  } catch (e) {
    console.log('Error finding pnpm path:', e.message);
  }

  // Also check direct path
  const directPath = path.join(__dirname, '../node_modules/@hanzo/ui');
  if (fs.existsSync(directPath)) {
    paths.push(directPath);
  }

  return paths;
};

const hanzoPaths = findHanzoPaths();
if (hanzoPaths.length === 0) {
  console.log('Warning: Could not find @hanzo/ui package');
  process.exit(0); // Exit gracefully
}

console.log('Found @hanzo/ui at:', hanzoPaths.length, 'locations');

// Patch all found @hanzo/ui installations
hanzoPaths.forEach(hanzoPath => {
  console.log('Patching:', hanzoPath);

  // Patch dist files
  const distFiles = ['dist/index.mjs', 'dist/chunk-6H62JRNM.mjs'];
  distFiles.forEach(file => {
    const filePath = path.join(hanzoPath, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Comment out problematic imports
      content = content.replace(/import\s+.*?from\s+['"]@hanzo_network\/hanzo-i18n['"]/g, '// Stubbed: @hanzo_network/hanzo-i18n');
      content = content.replace(/import\s+.*?from\s+['"]@hanzo_network\/hanzo-node-state.*?['"]/g, '// Stubbed: hanzo-node-state');
      content = content.replace(/import\s+.*?from\s+['"]@tauri-apps\/plugin-dialog['"]/g, 'const dialog = {}; // Stubbed: tauri dialog');
      content = content.replace(/import\s+.*?from\s+['"]@tauri-apps\/plugin-fs['"]/g, 'const fs = {}; // Stubbed: tauri fs');
      content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]filesize['"]/g, 'const filesize = (b) => `${b}B`; // Stubbed: filesize');
      content = content.replace(/import\s+filesize\s+from\s+['"]filesize['"]/g, 'const filesize = (b) => `${b}B`; // Stubbed: filesize');

      // Fix react-hook-form imports - stub them since they're causing issues
      if (content.includes('react-hook-form')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-hook-form['"]/g, (match, imports) => {
          const stubs = imports.split(',').map(imp => {
            const name = imp.trim();
            if (name === 'Controller') return `const Controller = () => null;`;
            if (name === 'useFormContext') return `const useFormContext = () => ({});`;
            if (name === 'FormProvider') return `const FormProvider = ({children}) => children;`;
            return `const ${name} = () => {};`;
          }).join(' ');
          return stubs;
        });
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log('  Patched:', file);
    }
  });

  // Also patch dist/index.js if it exists
  const distJsPath = path.join(hanzoPath, 'dist/index.js');
  if (fs.existsSync(distJsPath)) {
    let content = fs.readFileSync(distJsPath, 'utf8');

    // Apply same patches
    content = content.replace(/require\(['"]@hanzo_network\/hanzo-i18n['"]\)/g, '({}) // Stubbed: hanzo-i18n');
    content = content.replace(/require\(['"]@hanzo_network\/hanzo-node-state.*?['"]\)/g, '({}) // Stubbed: hanzo-node-state');
    content = content.replace(/require\(['"]@tauri-apps\/plugin-dialog['"]\)/g, '({}) // Stubbed: tauri dialog');
    content = content.replace(/require\(['"]@tauri-apps\/plugin-fs['"]\)/g, '({}) // Stubbed: tauri fs');
    content = content.replace(/require\(['"]filesize['"]\)/g, '((b) => `${b}B`) // Stubbed: filesize');

    fs.writeFileSync(distJsPath, content, 'utf8');
    console.log('  Patched: dist/index.js');
  }
});

console.log('Dist patching complete!');