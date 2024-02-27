import react from '@vitejs/plugin-react';
import { defineConfig, splitVendorChunkPlugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // creating a chunk to syntax-highlighter deps. Reducing the vendor chunk size
          if (id.includes('react-syntax-highlighter')) {
            return '@react-syntax-highlighter';
          }
          // creating a chunk to react routes deps. Reducing the vendor chunk size
          if (id.includes('react-router-dom') || id.includes('react-router')) {
            return '@react-router';
          }
          if (id.includes('antd') || id.includes('ant-design')) {
            return '@antd';
          }
          if (id.includes('react-quill')) {
            return '@react-quill';
          }
          if (id.includes('recharts')) {
            return '@recharts';
          }
        },
      },
    },
  },
  server: {
    port: 5174,
  },
});
