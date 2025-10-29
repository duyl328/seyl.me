import {defineConfig, type SiteConfig} from 'vitepress'
// 自动导入 TDesign
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {TDesignResolver} from 'unplugin-vue-components/resolvers'

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
        ['meta', { name: 'theme-color', content: '#ffffff' }]
    ],
    // https://vitepress.dev/reference/site-config#transformhead
    async transformHead(context) {
        return handleHeadMeta(context)
    },
    buildEnd: (config: SiteConfig) => {
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
