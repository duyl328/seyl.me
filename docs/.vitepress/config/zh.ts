import { type DefaultTheme, defineConfig } from 'vitepress'

import autoSidebar from '../autoSidebar'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'duyl328',
  description: '广泛涉猎的开发者，主要使用：Kotlin、Vue，也会 Python、C#、Java、Rust',
  lang: 'zh-Hans', // 语言
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '博客', link: '/' },
      { text: '归档', link: '/archive', activeMatch: '/archive' },
      { text: '笔记', link: '/notes/', activeMatch: '/notes/' },
      { text: '相册', link: '/gallery/', activeMatch: '/gallery/' },
      { text: '关于', link: '/about', activeMatch: '/about' },
      // { text: "赞助", link: "/support-me", activeMatch: '/support-me' },
    ],
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '当前页面',
    },
    lastUpdated: {
      text: '最近更新时间',
    },

    sidebar: autoSidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/duyl328' },
    ],

    editLink: {
      pattern: 'https://github.com/duyl328/seyl.me/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '深色模式',
  },
})

export const search: DefaultTheme.AlgoliaSearchOptions['locales'] = {
  root: {
    placeholder: '搜索文档',
    translations: {
      button: {
        buttonText: '搜索文档',
        buttonAriaLabel: '搜索文档',
      },
      modal: {
        searchBox: {
          resetButtonTitle: '清除查询条件',
          resetButtonAriaLabel: '清除查询条件',
          cancelButtonText: '取消',
          cancelButtonAriaLabel: '取消',
        },
        startScreen: {
          recentSearchesTitle: '搜索历史',
          noRecentSearchesText: '没有搜索历史',
          saveRecentSearchButtonTitle: '保存至搜索历史',
          removeRecentSearchButtonTitle: '从搜索历史中移除',
          favoriteSearchesTitle: '收藏',
          removeFavoriteSearchButtonTitle: '从收藏中移除',
        },
        errorScreen: {
          titleText: '无法获取结果',
          helpText: '你可能需要检查你的网络连接',
        },
        footer: {
          selectText: '选择',
          navigateText: '切换',
          closeText: '关闭',
          searchByText: '搜索提供方',
        },
        noResultsScreen: {
          noResultsText: '无法找到相关结果',
          suggestedQueryText: '你可以尝试查询',
          reportMissingResultsText: '你认为该查询应该有结果？',
          reportMissingResultsLinkText: '点击反馈',
        },
      },
    },
  },
}
