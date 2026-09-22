import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `--mode static` produces a build with relative asset paths and hash routing,
// so the output can be opened from any static host or sub-path.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'static' ? './' : '/',
  define: {
    __HASH_ROUTER__: JSON.stringify(mode === 'static'),
  },
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 800 },
}));
