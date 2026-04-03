import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: env.VERCEL_TOKEN
        ? {
            '/api/vercel': {
              target: 'https://api.vercel.com/v6',
              changeOrigin: true,
              rewrite: (path: string) => path.replace(/^\/api\/vercel/, ''),
              headers: {
                Authorization: `Bearer ${env.VERCEL_TOKEN}`,
              },
            },
          }
        : undefined,
    },
  }
})
