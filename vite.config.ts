import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/. In Actions the repo
// name comes from GITHUB_REPOSITORY; VITE_BASE overrides everything.
const repoName =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'chamber-sign-maker'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? `/${repoName}/`) : '/',
  plugins: [react()],
}))
