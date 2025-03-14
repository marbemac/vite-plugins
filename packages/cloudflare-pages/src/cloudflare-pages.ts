import { builtinModules } from 'module'
import type { Plugin, UserConfig } from 'vite'
import { getEntryContent } from './entry.js'

type CloudflarePagesOptions = {
  entry?: string | string[]
  outputDir?: string
  external?: string[]
  minify?: boolean
  emptyOutDir?: boolean
}

export const defaultOptions: Required<CloudflarePagesOptions> = {
  entry: ['./src/index.tsx', './app/server.ts'],
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: true,
}

export const cloudflarePagesPlugin = (options?: CloudflarePagesOptions): Plugin => {
  const virtualEntryId = 'virtual:cloudflare-pages-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId

  return {
    name: '@hono/vite-cloudflare-pages',
    resolveId(id) {
      if (id === virtualEntryId) {
        return resolvedVirtualEntryId
      }
    },
    async load(id) {
      if (id === resolvedVirtualEntryId) {
        return await getEntryContent({
          entry: options?.entry
            ? Array.isArray(options.entry)
              ? options.entry
              : [options.entry]
            : [...defaultOptions.entry],
        })
      }
    },
    config: async (): Promise<UserConfig> => {
      return {
        ssr: {
          external: options?.external ?? defaultOptions.external,
          noExternal: true,
        },
        build: {
          emptyOutDir: options?.emptyOutDir ?? defaultOptions.emptyOutDir,
          minify: options?.minify ?? defaultOptions.minify,
          ssr: true,
          rollupOptions: {
            external: [...builtinModules, /^node:/],
            input: virtualEntryId,
            output: {
              entryFileNames: '_worker.js',
            },
          },
        },
      }
    },
  }
}
