import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // SPA отдаётся под /admin (через Caddy рядом с публичным сайтом)
  base: '/admin/',
  plugins: [
    // плагин роутера должен идти до react()
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Caddy в Docker ходит на хост через host.docker.internal, а не через loopback
    host: true,
    // при открытии напрямую (без Caddy) API проксирует сам Vite
    proxy: { '/api': 'http://localhost:4000' },
  },
});
