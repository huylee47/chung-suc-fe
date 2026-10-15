import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['chung-suc-fe.onrender.com'],
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['chung-suc-fe.onrender.com'],
  },
});
