import { defineConfig } from 'vite'

export default defineConfig(({ _command }) => ({
  build: {
    outDir: 'public',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/wine-log-explorer-[hash].js',
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
}))
