import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' 使打包产物可部署到任意静态目录（不依赖服务器根路径）
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      // 忽略文件写入产生的临时目录，避免 Windows 下 watcher 崩溃
      ignored: (p) => /\.tmpdir|\.tmp$|\.cache/.test(p)
    }
  }
})
