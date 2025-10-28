import { defineConfig } from 'vitepress'
import markdownItFootnote from 'markdown-it-footnote'

import shared from './shared'
import zh from './zh'

export default defineConfig({
  ...shared,
  locales: {
    root: { label: '简体中文', ...zh },
  },
  themeConfig: {
    footer: {
      message: '本站除转载文章或特殊说明外，均遵守 <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh" target="_blank" rel="noopener">CC BY-SA 4.0</a> 协议发布',
      copyright: '© 2021-2025 <a href="https://seyl.me/" target="_blank" rel="noopener">duyl328</a> ',
    },
  },
  markdown: {
    math: true,
    config: (md) => {
      // 添加脚注
      md.use(markdownItFootnote)
    },
  },
})

