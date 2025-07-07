import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths';
import viteLogger from 'vite-log-handler';
import babelMacros from 'vite-plugin-babel-macros';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
    },
    // plugins: [react()],
    plugins: [
        babelMacros(),
        {
            name: 'treat-js-files-as-jsx',
            async transform(code, id) {
                if (!id.match(/src\/.*\.js$/)) return null;
                return transformWithEsbuild(code, id, {
                    loader: 'js',
                    jsx: 'automatic',
                });
            },
        },
        react(),
        viteLogger(),
        viteTsconfigPaths()
    ],
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000  
        port: 8000,
        host: "127.0.0.1",
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            }
        },
    }
  };
});