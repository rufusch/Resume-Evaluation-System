import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const codespaceHost = process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
  ? `${process.env.CODESPACE_NAME}-5173.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
  : null

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: codespaceHost ? [codespaceHost] : [],
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (_error, _request, response) => {
            if (response && 'writeHead' in response && !response.headersSent) {
              response.writeHead(503, { 'Content-Type': 'application/json' })
              response.end(JSON.stringify({ detail: 'Career Lens backend is unavailable. Start it on port 8000, then try again.' }))
            }
          })
        },
      },
    },
  },
})
