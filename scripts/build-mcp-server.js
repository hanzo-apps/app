#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildMCPServer() {
  console.log('Building Hanzo App MCP Server...');

  try {
    // Build standalone MCP server
    await build({
      entryPoints: [path.join(__dirname, '../src/ts/chat/lib/mcp-server/standalone.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(__dirname, '../dist/mcp-server.js'),
      external: [
        '@tauri-apps/api',
        '@tauri-apps/plugin-*',
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/index.js',
        '@modelcontextprotocol/sdk/server/stdio.js',
      ],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      minify: false,
      sourcemap: true,
      banner: {
        js: '#!/usr/bin/env node',
      },
      plugins: [
        {
          name: 'alias',
          setup(build) {
            // Alias @/ to src/ts/
            build.onResolve({ filter: /^@\// }, args => {
              const resolvedPath = path.join(__dirname, '../src/ts', args.path.slice(2));
              // Add .ts extension if not present
              if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.tsx')) {
                return { path: resolvedPath + '.ts' };
              }
              return { path: resolvedPath };
            });
          },
        },
      ],
    });

    console.log('✅ MCP Server built successfully!');
    console.log('📍 Output: dist/mcp-server.js');
    console.log('\nTo use with Claude Desktop, add to your config:');
    console.log(JSON.stringify({
      "hanzo-app": {
        "command": "node",
        "args": [path.join(__dirname, '../dist/mcp-server.js')],
        "env": {}
      }
    }, null, 2));
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildMCPServer();