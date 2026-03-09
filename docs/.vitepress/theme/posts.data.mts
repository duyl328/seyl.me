import { createContentLoader } from 'vitepress'

interface Post {
  title: string
  url: string
  date: {
    time: number
    string: string
    year: string
    monthDay: string
  }
  tags: string[]
  excerpt: string | undefined
  readingTime: number
}

export declare const data: Post[]

export default createContentLoader('posts/**/*.md', {
  excerpt: excerptFn,
  includeSrc: true,
  transform (raw): Post[] {
    return raw.map(({ url, frontmatter, excerpt, src }) => ({
      title: frontmatter.title,
      url,
      excerpt,
      date: formatDate(frontmatter.date),
      tags: frontmatter.tags || [],
      readingTime: calculateReadingTime(src || ''),
    })).sort((a, b) => b.date.time - a.date.time)
  },
})

function excerptFn (file: {
  data: { [key: string]: any };
  content: string;
  excerpt?: string
}, options?: any) {
  const SEP = '<!-- DESC SEP -->'
  if (file.content.includes(SEP)) {
    file.excerpt = file.content.split(SEP)[1]
    return
  }
  // 回退：取首段文本，去除代码块与 HTML 标签并截断
  const withoutFrontmatter = file.content.replace(/^---[\s\S]*?---\s*/, '')
  const withoutCode = withoutFrontmatter.replace(/```[\s\S]*?```/g, '')
  const withoutHtml = withoutCode.replace(/<[^>]+>/g, '')
  const firstPara = withoutHtml.split(/\n\s*\n/)[0] || withoutHtml
  file.excerpt = firstPara.trim().slice(0, 200)
}

function calculateReadingTime (content: string): number {
  // 移除 frontmatter
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '')
  // 移除代码块（阅读速度较慢）
  const withoutCode = withoutFrontmatter.replace(/```[\s\S]*?```/g, '')
  // 移除 HTML 标签
  const withoutHtml = withoutCode.replace(/<[^>]+>/g, '')
  // 移除 Markdown 语法
  const cleanText = withoutHtml.replace(/[#*`\[\]()]/g, '')

  const charCount = cleanText.length
  // 中文：350 字/分钟（300-400 的中间值）
  // 每个代码块额外增加 30 秒理解时间
  const codeBlocks = (content.match(/```/g) || []).length / 2
  const baseTime = Math.ceil(charCount / 350)
  const codeTime = Math.ceil(codeBlocks * 0.5)

  return Math.max(1, baseTime + codeTime) // 最少 1 分钟
}

function formatDate (raw: string): Post['date'] {
  const date = new Date(raw)
  date.setUTCHours(12)
  return {
    time: +date,
    string: date.toLocaleDateString('zh-Hans', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    year: date.toLocaleDateString('zh-Hans', {
      year: 'numeric',
    }),
    monthDay: date.toLocaleDateString('zh-Hans', {
      month: '2-digit',
      day: '2-digit',
    }),
  }
}
