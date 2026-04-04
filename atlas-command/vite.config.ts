import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const plugins: PluginOption[] = [react(), tailwindcss()]

  if (env.ANALYZE === 'true') {
    // @ts-expect-error — rollup-plugin-visualizer is an optional devDependency, only used with `npm run analyze`
    const { visualizer } = await import('rollup-plugin-visualizer')
    plugins.push(visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true }) as PluginOption)
  }

  return {
    plugins,
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
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
