import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Plugin: actualiza la versión del SW automáticamente en cada build
const swVersionPlugin = () => ({
  name: 'sw-version',
  closeBundle() {
    const swPath = path.resolve(__dirname, 'dist/sw.js');
    if (!fs.existsSync(swPath)) return;
    const version = `egchat-v${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString(36)}`;
    let content = fs.readFileSync(swPath, 'utf-8');
    content = content.replace(/const CACHE = 'egchat-v[^']+';/, `const CACHE = '${version}';`);
    fs.writeFileSync(swPath, content);
    console.log(`[sw-version] Cache version updated to: ${version}`);
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), swVersionPlugin()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3001,
    middlewareMode: false,
    hmr: { host: 'localhost' },
  },
});
