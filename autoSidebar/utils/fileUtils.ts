/**
 * Utility helpers for file path operations
 */
import path from 'path'

export class FileUtils {
  /**
   * 获取指定路径的文件名
   * @param url
   */
  static getFileName (url: string) {
    url = url.replace(/\\/g, '/')
    const segments = url.split('/')
    return segments[segments.length - 1]
  }

  /**
   * 获取指定路径最后一个文件夹
   * @param url
   */
  static getLastFolderName (url: string): string {
    // 统一路径分隔符为 '/'
    url = url.replace(/\\/g, '/')
    const segments = url.split('/')

    if (segments[segments.length - 1].includes('.')) {
      return segments[segments.length - 2]
    }

    return segments[segments.length - 1]
  }

  /**
   * 截断指定路径
   */
  static getRelativePath (fullPath: string, rootPath: string): string {
    const relativePath = path.relative(rootPath, fullPath)

    // 统一为 POSIX 风格分隔符，避免 Windows 下出现 "\\"
    const normalizedPath = relativePath.replace(/\\/g, '/')

    // 处理同路径场景，保证上层拼接链接稳定
    if (normalizedPath === '' || normalizedPath === '.') {
      return ''
    }

    return normalizedPath
  }

  /**
   * 按照指定的规则截断路径
   * 如果是正数，返回前 n 个文件夹路径；如果是负数，返回倒数 n 个到 0。
   * @param url
   * @param n
   */
  static getRoleFolderName (url: string, n: number): string {
    url = url.replace(/\\/g, '/')
    const segments = url.split('/')
    if (n > 0) {
      return segments.slice(0, n).join('/')
    } else if (n < 0) {
      return segments.slice(0, segments.length + n).join('/')
    } else {
      return ''
    }
  }

  /**
   * 去除后缀名
   * @param filename
   */
  static removeExtension (filename: string) {
    return filename.slice(0, filename.lastIndexOf('.')) || filename
  }
}
