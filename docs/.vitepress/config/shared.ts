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
        ['meta', { name: 'msvalidate.01', content: '74145A0C19682BC79C3B9FC837149152' }]
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
                        importStyle: 'css',
                    })],
            }),
            Components({
                resolvers: [
                    TDesignResolver({
                        library: 'vue-next',
                        importStyle: 'css',
                    })],
            }),
        ],
    },
})
