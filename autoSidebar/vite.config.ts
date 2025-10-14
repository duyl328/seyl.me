import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // 也可以是多个入口点的字典或数组
      entry: resolve(__dirname, './index.ts'),
      name: 'autoSidebar',
      // 将添加适当的扩展
      fileName: 'autoSidebar',
    },
  },
})
