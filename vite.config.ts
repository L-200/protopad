/**
 * @fileoverview Configuração do Vite conectando o plugin React e o middleware local
 * de síntese neural offline (`piperTtsPlugin`) em `/api/tts`, ignorando `.tts/**` no watcher.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { piperTtsPlugin } from './scripts/piper-tts-plugin.mjs';

export default defineConfig({
  plugins: [react(), piperTtsPlugin()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/.tts/**'],
    },
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
  },
});
