import fs from 'fs'
import path from 'path'
import type { DefaultTheme } from 'vitepress'
import { FileUtils } from './utils/fileUtils'

type SidebarItem = DefaultTheme.SidebarItem

// type Sidebar = DefaultTheme.Sidebar

export function createSideBar (docsDir: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('createSideBarZH ======================= ')
  }
  // console.log(createSideBarEN1())
  let dDir = FileUtils.getRoleFolderName(docsDir, -1)
  let filesRecursively = getFilesRecursively(docsDir)
  let message = divideSidebar(filesRecursively.contents, dDir)
  
  // 保持静默（生产环境不输出遍历日志）
  // 设置第一个组展开，其他组折叠
  if (message.length > 0) {
    message[0].collapsed = false
    for (let i = 1; i < message.length; i++) {
      message[i].collapsed = true
    }
  }
  return {
    '/notes/': message,
  }
}

/**
 * 要获取的文件夹目录
 */
function getFilesRecursively (dirPath: string) {
  const result: FileOrDir = {
    type: 'directory',
    path: dirPath,
    contents: [],
    parentFolder: '',
  }

  // 获取并排序（目录优先，其次文件；中文自然序）
  const entries = fs.readdirSync(dirPath, { withFileTypes: true }) as unknown as Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
  const collator = new Intl.Collator('zh-Hans')
  entries.sort((a, b) => {
    const aIsDir = a.isDirectory()
    const bIsDir = b.isDirectory()
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
    return collator.compare(a.name, b.name)
  })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      result.contents!.push(getFilesRecursively(fullPath))
    } else if (entry.isFile()) {
      result.contents!.push({
        type: 'file',
        path: fullPath,
        contents: undefined,
        parentFolder: result.path,
      })
    }
  }

  return result
}

/**
 * 获取根目录
 * @param dir
 */
function getProjectRoot (dir: string): string {
  const root = path.resolve(dir)
  // 查找 package.json 文件，判断是否到达根目录
  if (fs.existsSync(path.join(root, 'package.json'))) {
    return root
  } else {
    const parentDir = path.dirname(root)
    // 递归向上查找
    if (parentDir === root) {
      throw new Error('Could not find the project root.')
    }
    return getProjectRoot(parentDir)
  }
}

/**
 * 通过文件夹目录划分 Sidebar
 */
function divideSidebar (
  files: FileOrDir[] | undefined, rootDir: string): SidebarItem[] {
  // undefined 处理
  if (!files?.length) return []
  
  let ans: SidebarItem[] = []
  for (let i = 0; i < files!.length; i++) {
    let file = files[i]
    // 如果有子项目，则该级别无链接
    if (file.type === 'file') {
      let fileName = FileUtils.removeExtension(FileUtils.getFileName(file.path))
      // 是否为 index 文件【index 跳过】（等值匹配，避免误伤）
      if (fileName.toLowerCase() === 'index') continue
      
      let relativePath = FileUtils.removeExtension(FileUtils.getRelativePath(file.path, rootDir))
      // 确保链接以 / 开头（VitePress 要求绝对路径）
      if (!relativePath.startsWith('/')) {
        relativePath = '/' + relativePath
      }
      let obj: SidebarItem = {
        text: fileName,
        link: relativePath,
      }
      ans.push(obj)
    } else if (file.type === 'directory') {
      let folderName = FileUtils.getLastFolderName(file.path)
      let res: SidebarItem[] = []
      if (!(file.contents?.length !== 0)) {
        // 空文件夹进行单独处理
        let obj: SidebarItem = {
          text: folderName + '[待更新]',
          collapsed: true,
          items: [],
        }
        res.push(obj)
      } else {
        let items = divideSidebar(file.contents, rootDir)
        res.push({
          text: folderName,
          collapsed: true,
          items: items,
        })
      }
      
      ans = ans.concat(res)
    }
  }
  return ans
}

/**
 * 文件和文件夹的区分
 */
type FileOrDir = {
  // 父文件夹
  parentFolder: string,
  type: 'directory' | 'file',
  path: string,
  contents: FileOrDir[] | undefined
}
