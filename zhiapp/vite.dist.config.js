import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 便携版专用构建：只打包主应用（index.html），把管理后台 admin.html 及其资源排除在外，
// 产物输出到 release/dist，供打包成单个可双击运行的 .exe。
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'release/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: (p) => /\.tmpdir|\.tmp$|\.cache/.test(p)
    }
  }
})
