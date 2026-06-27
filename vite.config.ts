import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { AIRequestError, completeChat, getProviderStatus } from './server/ai.mjs'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function localAiApi(env) {
  return {
    name: 'local-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response) => {
        response.setHeader('Content-Type', 'application/json')

        if (request.method === 'GET') {
          response.statusCode = 200
          response.end(JSON.stringify(getProviderStatus(env)))
          return
        }

        if (request.method !== 'POST') {
          response.statusCode = 405
          response.setHeader('Allow', 'GET, POST')
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }

        try {
          const chunks = []
          let size = 0
          for await (const chunk of request) {
            size += chunk.length
            if (size > 1_000_000) throw new AIRequestError(413, 'Request is too large.')
            chunks.push(chunk)
          }
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          const result = await completeChat(payload, env)
          response.statusCode = 200
          response.end(JSON.stringify(result))
        } catch (error) {
          response.statusCode = error instanceof AIRequestError ? error.status : 500
          response.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unable to complete the request.',
          }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }

  return {
    plugins: [
      figmaAssetResolver(),
      localAiApi(env),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})