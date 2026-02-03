import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/api/ball-bounce/',  // EAI Hub 프록시 경로 - 에셋 로드용
  server: {
    port: 9001,
  },
})
