import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public-ar/*', 
          dest: ''            
        }
      ]
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/BazyDanych/' : '/',
  envPrefix: "VITE_",
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
});
