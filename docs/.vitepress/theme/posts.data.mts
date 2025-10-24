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
}

export declare const data: Post[]

export default createContentLoader('posts/**/*.md', {
  excerpt: excerptFn,
  transform (raw): Post[] {
    return raw.map(({ url, frontmatter, excerpt }) => ({
      title: frontmatter.title,
      url,
      excerpt,
      date: formatDate(frontmatter.date),
      tags: frontmatter.tags,
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
