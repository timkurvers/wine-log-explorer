import { defineConfig } from 'vite'

export default defineConfig(({ _command }) => ({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/wine-relay-explorer-[hash].js',
      },
    },
  },
}))
