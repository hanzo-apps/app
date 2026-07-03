/**
 * Build validation tests
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Build Validation', () => {
  it('should have valid package.json', () => {
    const packagePath = path.join(process.cwd(), 'package.json');
    expect(fs.existsSync(packagePath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    expect(pkg.name).toBe('hanzo-ai');
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
  });

  it('should have required config files', () => {
    const requiredFiles = [
      'next.config.js',
      'tailwind.config.ts',
      'tsconfig.json',
      '.env.example'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have required directories', () => {
    const requiredDirs = [
      'app',
      'components',
      'public',
      'lib'
    ];

    requiredDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    });
  });
});