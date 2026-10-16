import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/tradovate-demo': {
        target: 'https://demo.tradovateapi.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tradovate-demo/, ''),
      },
      '/tradovate-live': {
        target: 'https://live.tradovateapi.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tradovate-live/, ''),
      },
      '/api-yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-yahoo/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
    },
  },
})
