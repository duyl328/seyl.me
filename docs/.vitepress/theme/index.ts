// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme-without-fonts' // https://vitepress.dev/zh/guide/extending-default-theme#using-different-fonts
// 数学公式（KaTeX）样式
import 'katex/dist/katex.min.css'

import './style.css'
import Comment from './components/Comment.vue'
import ImageViewer from './components/ImageViewer.vue'
import GoBack from './components/GoBack.vue'
import PhotoWall from './components/PhotoWall.vue'

export default {
	...Theme,
	Layout: () => {
		return h(Theme.Layout, null, {
			// https://vitepress.dev/guide/extending-default-theme#layout-slots
			'doc-after': () => h(Comment),
			'doc-bottom': () => h(ImageViewer),
			'aside-top': () => h(GoBack),
		})
	},
	enhanceApp (ctx) {
		Theme.enhanceApp?.(ctx)
		ctx.app.component('PhotoWall', PhotoWall)
	},
}

