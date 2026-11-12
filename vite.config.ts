import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const proxy = { '/api/local': { target: 'http://127.0.0.1:3100' } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { manifest: true },
  server: { proxy, fs: { deny: ['.env', '.env.*', '**/*.{crt,pem}', '**/.[gG][iI][tT]/**', '**/.[lL][oO][cC][aA][lL]/**'] } },
  preview: { proxy },
})
