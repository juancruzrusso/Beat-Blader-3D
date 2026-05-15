import { defineConfig } from 'vite';

// La base la setea el workflow de GitHub Pages: VITE_BASE=/Beat-Blader-3D/
// En dev local queda en '/' que es lo cómodo.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1024,
  },
});
