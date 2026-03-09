import { type HeadConfig, type TransformContext } from 'vitepress'
import { generateArticleSchema, generateOrganizationSchema, generateBreadcrumbSchema } from './structuredData'

// 处理每个页面的元数据
export function handleHeadMeta (context: TransformContext) {
  // 预加载字体
  const preloadHead: HeadConfig[] = handleFontsPreload(context)
  // 添加 Canonical URL
  const canonicalHead: HeadConfig[] = handleCanonical(context)
  // 添加结构化数据
  const schemaHead: HeadConfig[] = [
    ...generateArticleSchema(context),
    ...generateOrganizationSchema(context),
    ...generateBreadcrumbSchema(context)
  ]

  return [ ...preloadHead, ...canonicalHead, ...schemaHead]
}

export function addBase (relativePath: string) {
  const host = 'https://seyl.me'
  if (relativePath.startsWith('/')) {
    return host + relativePath
  } else {
    return host + '/' + relativePath
  }
}

export function handleCanonical ({ pageData }: TransformContext): HeadConfig[] {
  const host = 'https://seyl.me'
  // 处理相对路径，移除 index.md 和 .md 后缀
  let canonicalPath = pageData.relativePath
    .replace(/index\.md$/, '')
    .replace(/\.md$/, '')

  // 确保路径以 / 开头
  if (!canonicalPath.startsWith('/')) {
    canonicalPath = '/' + canonicalPath
  }

  // 移除末尾的 /（除非是根路径）
  if (canonicalPath !== '/' && canonicalPath.endsWith('/')) {
    canonicalPath = canonicalPath.slice(0, -1)
  }

  const canonicalUrl = `${host}${canonicalPath}`

  return [
    ['link', { rel: 'canonical', href: canonicalUrl }]
  ]
}

export function handleFontsPreload ({ assets }: TransformContext) {
  // 只预加载正文字体，代码字体不预加载，因为可能不会使用或者很少使用
  const SourceHanSerifCN = assets.find(
    file => /SourceHanSerifCN-VF\.\w+\.woff2/.test(file))

  if (SourceHanSerifCN) {
    return [
      [
        'link',
        {
          rel: 'preload',
          href: SourceHanSerifCN,
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
      ],
    ] as HeadConfig[]
  }

  return []
}
