/**
 * Time:2025/1/18 13:06 09
 * Name:index.ts
 * Path:autoSidebar
 * ProjectName:github.io
 * Author:charlatans
 *
 *  Il n'ya qu'un héroïsme au monde :
 *     c'est de voir le monde tel qu'il est et de l'aimer.
 */

import type { Plugin, ViteDevServer } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createSideBar } from './createSideBar'
import { FileUtils } from './utils/fileUtils'

/**
 * 根据目录生成展示列表【目录从根目录开始】
 * @param genPath 生成 Sidebar 文件目录
 * @param docPath 文档目录
 */
export default function autoGenerateSidebar (
  genPath: string, docPath: string): Plugin {
  // __dirname 兼容 ESM
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  let roleFolderName = FileUtils.getRoleFolderName(__dirname, -1)
  
  // 完整路径
  const docP = path.join(roleFolderName, docPath)
  if (process.env.NODE_ENV !== 'production') {
    console.log(docP, '=====docP=====')
  }
  let sidebarP = path.join(roleFolderName, genPath)
  if (process.env.NODE_ENV !== 'production') {
    console.log(sidebarP,'++++sidebarP++++')
  }
  // /home/runner/work/duyl328.github.io/duyl328.github.io/docs/notes
  // /home/runner/work/duyl328.github.io/duyl328.github.io/docs/.vitepress
  
  return {
    name: 'autoSidebar',
    config (config) {
      let sideBar = createSideBar(docP)
      // 生成的 TypeScript 文件内容
      const decodedData = JSON.stringify(sideBar, (key, value) => {
        if (typeof value === 'string') {
          // 解码字符串中的 URL 编码
          return decodeURIComponent(value);
        }
        return value;
      }, 2);
      
      const tsContent = `export default ${decodedData}`
      // 定义生成文件的路径
      const tsFilePath = path.resolve(sidebarP, 'autoSidebar.ts')
      // 确保目录存在，如果不存在则创建它
      fs.mkdirSync(sidebarP, { recursive: true })
      // 写入文件
      fs.writeFileSync(tsFilePath, tsContent, 'utf-8')
      if (process.env.NODE_ENV !== 'production') {
        console.log('Generated TypeScript file at', tsFilePath)
      }
      
      return config
    },
  }
}
