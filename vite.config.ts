import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // garante que o dev server escute em 0.0.0.0
    port: 3000
  },
  preview: {
    host: true, // garante que o preview escute em 0.0.0.0
    port: process.env.PORT || 3000,
    allowedHosts: ['provador-virtual-jbp1.onrender.com'] // libera o domínio público do Render
  },
  build: {
    outDir: 'dist'
  }
});
