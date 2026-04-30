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
  build: {
    // Minificación selectiva — esbuild falla con minifyIdentifiers en este codebase
    minify: false,
    minifyWhitespace: true,
    minifySyntax: false,
    // Separar chunks para carga lazy — librerías pesadas se cargan solo cuando se necesitan
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@maptiler')) return 'maptiler';
          if (id.includes('tesseract')) return 'tesseract';
          if (id.includes('framer-motion') || (id.includes('/motion/') && !id.includes('react'))) return 'motion';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('qrcode') || id.includes('jsqr')) return 'qr';
          if (id.includes('@google/genai')) return 'genai';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-core';
          if (id.includes('lucide-react')) return 'icons';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1600,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@maptiler/sdk', 'tesseract.js'],
  },
});
