import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/. In Actions the repo
// name comes from GITHUB_REPOSITORY; VITE_BASE overrides everything.
const repoName =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'chamber-sign-maker'

const TEXTURE_FILES = new Set(['awe_total.png', 'awe_total_grey.png'])
const TEXTURE_DIRS = ['assets', '.']

/**
 * Dev-only: serve the user's game textures from the working directory at
 * /__game-textures/<file>. Nothing is copied into public/ or src/, and the
 * plugin doesn't exist in `vite build`, so textures never reach dist/.
 */
function gameTexturesDevServer(): Plugin {
  return {
    name: 'game-textures-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__game-textures/', (req, res) => {
        const name = decodeURIComponent((req.url ?? '').replace(/^\//, ''))
        const file = TEXTURE_FILES.has(name)
          ? TEXTURE_DIRS.map((dir) =>
              resolve(server.config.root, dir, name),
            ).find((path) => existsSync(path))
          : undefined
        if (!file) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'no-store')
        res.end(readFileSync(file))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? `/${repoName}/`) : '/',
  plugins: [react(), gameTexturesDevServer()],
}))
