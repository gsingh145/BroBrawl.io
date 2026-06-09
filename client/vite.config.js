import { defineConfig } from 'vite';

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: path.resolve(__dirname, '../server/public'),
    emptyOutDir: true,
  },
});
