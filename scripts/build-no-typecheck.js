#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Backup original next.config.ts
const configPath = path.join(__dirname, '..', 'next.config.ts');
const backupPath = path.join(__dirname, '..', 'next.config.ts.backup');

try {
  // Create backup
  const originalConfig = fs.readFileSync(configPath, 'utf8');
  fs.writeFileSync(backupPath, originalConfig);

  // Create modified config that completely skips type checking
  const modifiedConfig = originalConfig
    .replace(
      'ignoreBuildErrors: true,',
      `ignoreBuildErrors: true,
    tsconfigPath: false,`
    )
    .replace(
      'const nextConfig: NextConfig = {',
      `const nextConfig: NextConfig = {
  distDir: '.next',`
    );

  fs.writeFileSync(configPath, modifiedConfig);

  console.log('Running build with TypeScript checking disabled...');

  // Run patch script first
  const patch = spawn('node', ['scripts/patch-dist.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  patch.on('close', (code) => {
    if (code === 0) {
      // Set environment variable to skip type checking
      process.env.SKIP_TYPE_CHECK = 'true';
      process.env.TSC_COMPILE_ON_ERROR = 'true';

      // Run Next.js build
      const build = spawn('npx', ['next', 'build'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: {
          ...process.env,
          SKIP_TYPE_CHECK: 'true',
          TSC_COMPILE_ON_ERROR: 'true'
        }
      });

      build.on('close', (buildCode) => {
        // Restore original config
        fs.writeFileSync(configPath, originalConfig);
        fs.unlinkSync(backupPath);

        if (buildCode === 0) {
          console.log('✅ Build completed successfully!');
          process.exit(0);
        } else {
          console.log('❌ Build failed');
          process.exit(buildCode);
        }
      });
    } else {
      // Restore config on patch failure
      fs.writeFileSync(configPath, originalConfig);
      fs.unlinkSync(backupPath);
      process.exit(code);
    }
  });

} catch (error) {
  console.error('Error:', error);
  // Restore config if it exists
  if (fs.existsSync(backupPath)) {
    const originalConfig = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(configPath, originalConfig);
    fs.unlinkSync(backupPath);
  }
  process.exit(1);
}