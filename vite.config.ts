import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiPort = Number(process.env.CAI_API_PORT ?? 3100)
if (!Number.isInteger(apiPort) || apiPort < 1024 || apiPort > 65535) throw new Error('CAI_API_PORT debe ser un puerto local entre 1024 y 65535.')
const proxy = { '/api/local': { target: `http://127.0.0.1:${apiPort}` } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { manifest: true },
  server: { proxy, fs: { deny: ['.env', '.env.*', '**/*.{crt,pem}', '**/.[gG][iI][tT]/**', '**/.[lL][oO][cC][aA][lL]/**'] } },
  preview: { proxy },
})
