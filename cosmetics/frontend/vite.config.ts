import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/api/cosmetics/',  // EAI Hub 프록시 경로 - 에셋 로드용
  server: {
    host: '127.0.0.1', // Force IPv4 only
    port: 9005, // Use port 9005 to avoid permission issues
    strictPort: false, // If port is in use, try next available port
    // EAI Hub 프록시 경유 시 WebSocket 미지원 → HMR 완전 비활성화
    // 참고: https://vite.dev/config/server-options.html#server-hmr
    hmr: false,
    proxy: {
      // /api/cosmetics 는 프론트엔드 경로이므로 제외, API만 백엔드로
      '/api/analyze': {
        target: 'http://localhost:8500',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://localhost:8500',
        changeOrigin: true,
      },
    }
  }
})

