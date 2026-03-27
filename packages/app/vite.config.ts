import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectRegister: false,
      injectManifest: {
        injectionPoint: undefined,
      },
    }),
  ],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      atoms: path.resolve(__dirname, 'src/atoms'),
      helper: path.resolve(__dirname, 'src/helper'),
      worker: path.resolve(__dirname, 'src/worker'),
      util: path.resolve(__dirname, 'src/util'),
    },
  },
  build: {
    outDir: 'build',
  },
  server: {
    open: false,
  },
});
