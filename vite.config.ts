import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    // Library build configuration
    return {
      plugins: [
        react(),
        dts({
          insertTypesEntry: true,
          exclude: ['**/*.test.*', '**/*.spec.*', 'tests/**/*']
        })
      ],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'PromptCraft',
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        },
        sourcemap: true,
        emptyOutDir: true
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './src')
        }
      }
    }
  }

  // App build configuration (default)
  return {
    plugins: [react()],
    build: {
      outDir: 'build',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'prompt_craft.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      port: 3000,
      open: true
    },
    preview: {
      port: 4173
    }
  }
})