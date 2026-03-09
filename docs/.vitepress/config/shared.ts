import {defineConfig, type SiteConfig} from 'vitepress'
// 自动导入 TDesign
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {TDesignResolver} from 'unplugin-vue-components/resolvers'
import { Feed } from 'feed'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { createContentLoader } from 'vitepress'

import {handleHeadMeta} from '../theme/utils/handleHeadMeta'
import {search as zhSearch} from './zh'
import sidebar from '../../../autoSidebar'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lastUpdated: true,
    cleanUrls: true,
    // 开发默认忽略死链；严格检查时可通过环境变量开启
    ignoreDeadLinks: process.env.STRICT_LINKS ? false : true,
    sitemap: {
        hostname: 'https://seyl.me',
    },
    base: process.env.BASE || '/',
    head: [
        ['meta', { name: 'msvalidate.01', content: '74145A0C19682BC79C3B9FC837149152' }],
        // Favicon配置
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
        ['link', { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' }],
        ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
        ['link', { rel: 'manifest', href: '/site.webmanifest' }],
        ['meta', { name: 'theme-color', content: '#ffffff' }],
        // RSS Feed
        ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'RSS Feed', href: '/feed.xml' }],
        ['link', { rel: 'alternate', type: 'application/atom+xml', title: 'Atom Feed', href: '/atom.xml' }],
        // Umami Analytics
        ['script', { defer: '', src: 'https://cloud.umami.is/script.js', 'data-website-id': 'fa9166e3-f118-4e38-a17f-9be469804569' }],
    ],
    // https://vitepress.dev/reference/site-config#transformhead
    async transformHead(context) {
        return handleHeadMeta(context)
    },
    async buildEnd(config: SiteConfig) {
        const feed = new Feed({
            title: 'duyl328的技术博客',
            description: '分享全栈开发经验，涵盖Vue、Kotlin、C#、Python、Rust等技术栈',
            id: 'https://seyl.me/',
            link: 'https://seyl.me/',
            language: 'zh-Hans',
            image: 'https://seyl.me/web-app-manifest-512x512.png',
            favicon: 'https://seyl.me/favicon.ico',
            copyright: '© 2021-2025 duyl328',
            feedLinks: {
                rss: 'https://seyl.me/feed.xml',
                atom: 'https://seyl.me/atom.xml',
            },
            author: {
                name: 'duyl328',
                link: 'https://seyl.me/about'
            }
        })

        // 加载所有博客文章
        const posts = await createContentLoader('posts/**/*.md', {
            excerpt: true,
            render: true
        }).load()

        // 按日期排序，取最新 20 篇
        posts
            .sort((a, b) => {
                const dateA = a.frontmatter?.date ? +new Date(a.frontmatter.date) : 0
                const dateB = b.frontmatter?.date ? +new Date(b.frontmatter.date) : 0
                return dateB - dateA
            })
            .slice(0, 20)
            .forEach(post => {
                const url = `https://seyl.me${post.url}`
                feed.addItem({
                    title: post.frontmatter?.title || 'Untitled',
                    id: url,
                    link: url,
                    description: post.frontmatter?.description || post.excerpt || '',
                    content: post.html || '',
                    author: [{
                        name: 'duyl328',
                        link: 'https://seyl.me/about'
                    }],
                    date: post.frontmatter?.date ? new Date(post.frontmatter.date) : new Date(),
                    category: post.frontmatter?.tags?.map((tag: string) => ({ name: tag })) || []
                })
            })

        // 生成 RSS 和 Atom
        writeFileSync(resolve(config.outDir, 'feed.xml'), feed.rss2())
        writeFileSync(resolve(config.outDir, 'atom.xml'), feed.atom1())

        console.log('✅ RSS Feed generated: feed.xml, atom.xml')
    },

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        outline: [2, 4],

        search: {
            provider: 'local',
            options: {
                locales: {...zhSearch},
            },
        },

        externalLinkIcon: true,
    },

    vite: {
        build: {
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        // Vue 核心库
                        if (id.includes('node_modules/vue') || id.includes('node_modules/@vue')) {
                            return 'vue-vendor'
                        }
                        // TDesign UI 库
                        if (id.includes('node_modules/tdesign-vue-next') || id.includes('node_modules/tdesign-icons-vue-next')) {
                            return 'tdesign'
                        }
                        // Markdown 相关
                        if (id.includes('node_modules/markdown-it') || id.includes('node_modules/katex')) {
                            return 'markdown'
                        }
                        // Giscus 评论
                        if (id.includes('node_modules/@giscus')) {
                            return 'giscus'
                        }
                    }
                }
            },
            chunkSizeWarningLimit: 1000,
        },
        plugins: [
            // 自动更新列表
            sidebar('docs/.vitepress', 'docs/notes'),
            AutoImport({
                resolvers: [
                    TDesignResolver({
                        library: 'vue-next',
                    })],
            }),
            Components({
                resolvers: [
                    TDesignResolver({
                        library: 'vue-next',
                    })],
            }),
        ],
    },
})
