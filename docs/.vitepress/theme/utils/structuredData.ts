import { type HeadConfig, type TransformContext } from 'vitepress'

/**
 * 生成文章的 JSON-LD Schema
 */
export function generateArticleSchema(context: TransformContext): HeadConfig[] {
  const { pageData } = context

  // 仅为博客文章生成 Schema（posts 目录下的文章）
  if (!pageData.relativePath.startsWith('posts/')) {
    return []
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: pageData.title || pageData.frontmatter.title,
    description: pageData.description || pageData.frontmatter.description,
    author: {
      '@type': 'Person',
      name: 'duyl328',
      url: 'https://seyl.me/about'
    },
    datePublished: pageData.frontmatter.date,
    dateModified: pageData.lastUpdated || pageData.frontmatter.date,
    image: pageData.frontmatter.image || 'https://seyl.me/web-app-manifest-512x512.png',
    publisher: {
      '@type': 'Organization',
      name: 'duyl328的技术博客',
      logo: {
        '@type': 'ImageObject',
        url: 'https://seyl.me/favicon.svg'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://seyl.me/${pageData.relativePath.replace(/\.md$/, '').replace(/index$/, '')}`
    }
  }

  // 如果有标签，添加关键词
  if (pageData.frontmatter.tags && Array.isArray(pageData.frontmatter.tags)) {
    Object.assign(schema, {
      keywords: pageData.frontmatter.tags.join(', ')
    })
  }

  return [
    ['script', { type: 'application/ld+json' }, JSON.stringify(schema)]
  ]
}

/**
 * 生成个人/组织的 JSON-LD Schema
 */
export function generateOrganizationSchema(context: TransformContext): HeadConfig[] {
  const { pageData } = context

  // 仅在首页和关于页面添加
  if (pageData.relativePath !== 'index.md' && pageData.relativePath !== 'about.md') {
    return []
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'duyl328',
    url: 'https://seyl.me',
    sameAs: [
      'https://github.com/duyl328'
    ],
    jobTitle: '全栈开发者',
    description: '广泛涉猎的开发者，主要使用：Kotlin、Vue，也会 Python、C#、Java、Rust',
    knowsAbout: ['Kotlin', 'Vue', 'Python', 'C#', 'Java', 'Rust', '全栈开发', '前端开发', '后端开发']
  }

  return [
    ['script', { type: 'application/ld+json' }, JSON.stringify(schema)]
  ]
}

/**
 * 生成面包屑导航的 JSON-LD Schema
 */
export function generateBreadcrumbSchema(context: TransformContext): HeadConfig[] {
  const { pageData } = context
  const pathSegments = pageData.relativePath
    .replace(/\.md$/, '')
    .replace(/\/index$/, '')
    .split('/')
    .filter(Boolean)

  // 首页不需要面包屑
  if (pathSegments.length === 0) {
    return []
  }

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: '首页',
      item: 'https://seyl.me/'
    }
  ]

  // 构建面包屑路径
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += '/' + segment
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: segment.replace(/-/g, ' ').replace(/^\d+/, '').trim(),
      item: `https://seyl.me${currentPath}`
    })
  })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  }

  return [
    ['script', { type: 'application/ld+json' }, JSON.stringify(schema)]
  ]
}
