---
# https://vitepress.dev/reference/default-theme-home-page
layout: doc
editLink: false
lastUpdated: false
isNoComment: true
isNoBackBtn: true
head:
  - - meta
    - name: google-site-verification
      content: 3mPuiYC0wAVCBtDCme-qNp7JrpYrua8fPLZyFgVZA98
  - - meta
    - name: msvalidate.01
      content: 74145A0C19682BC79C3B9FC837149152
  - - meta
    - name: description
      content: duyl328的技术博客，分享全栈开发经验。主要涉及Vue、Kotlin、C#、Python、Rust等技术栈，涵盖前端开发、后端开发、Windows桌面开发、工控自动化等领域的技术文章、项目实践和开发思考
  - - meta
    - name: keywords
      content: duyl328, 技术博客, 全栈开发, Vue, Kotlin, C#, Python, Rust, 前端开发, 后端开发, Windows桌面开发, WPF, Tauri, VitePress, 工控自动化, PLC, React, TypeScript, JavaScript, 编程思考, 开源项目
  - - meta
    - name: author
      content: duyl328
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: duyl328的技术博客
  - - meta
    - property: og:title
      content: duyl328 - 全栈开发者的技术博客
  - - meta
    - property: og:description
      content: 分享Vue、Kotlin、C#、Python、Rust等全栈开发经验，涵盖前端、后端、Windows桌面开发、工控自动化等领域的技术文章和项目实践
  - - meta
    - property: og:url
      content: https://seyl.me
  - - meta
    - property: og:image
      content: https://seyl.me/web-app-manifest-512x512.png
  - - meta
    - property: og:image:width
      content: "512"
  - - meta
    - property: og:image:height
      content: "512"
  - - meta
    - property: og:image:alt
      content: duyl328的技术博客
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: duyl328 - 全栈开发者的技术博客
  - - meta
    - name: twitter:description
      content: 分享Vue、Kotlin、C#、Python、Rust等全栈开发经验
  - - meta
    - name: twitter:image
      content: https://seyl.me/web-app-manifest-512x512.png
---

<!-- 之所以将代码写在 md 里面，而非单独封装为 Vue 组件，因为 aside 不会动态刷新，参考 https://github.com/vuejs/vitepress/issues/2686 -->
<template v-for="post in curPosts" :key="post.url">
  <h2 :id="post.title" class="post-title">
    <a :href="post.url">{{ post.title }}</a>
    <a
      class="header-anchor"
      :href="`#${post.title}`"
      :aria-label="`Permalink to &quot;${post.title}&quot;`"
      ></a
    >
    <div class="post-date hollow-text">{{ post.date.string }}</div>
  </h2>
  <t-tag
    v-for="tag in post.tags"
    class="mr-2"
    variant="outline"
    shape="round"
    >{{ tag }}</t-tag
  >
  <div v-if="post.excerpt" v-html="post.excerpt"></div>
</template>

<!-- <Pagination /> -->
<div class="pagination-container">
  <t-pagination
    v-model="current"
    v-model:pageSize="pageSize"
    :total="total"
    size="small"
    :showPageSize="false"
    :showPageNumber="!isMobile()"
    :showJumper="isMobile()"
    @current-change="onCurrentChange"
  />
</div>

<script lang="ts" setup>
import { ref, computed } from "vue";
// 非 Vue 组件需要手动引入
import {
	MessagePlugin,
	PaginationProps,
	Pagination as TPagination,
  Tag as TTag,
} from "tdesign-vue-next";

import { data as posts } from "./.vitepress/theme/posts.data.mts";
import { isMobile } from "./.vitepress/theme/utils/mobile.ts";

const search = typeof window !== 'undefined' ? window.location.search.slice(1) : ''
const searchParams = new URLSearchParams(search);
const page = searchParams.get("page") || 1;

const current = ref(+page);
const pageSize = ref(10);
const total = ref(posts.length);

const curPosts = computed(() => {
	return posts.slice(
		(current.value - 1) * pageSize.value,
		current.value * pageSize.value
	);
});

const onCurrentChange: PaginationProps["onCurrentChange"] = (
	index,
	pageInfo
) => {
	MessagePlugin.success(`转到第${index}页`);

	const url = new URL(window.location as any);
	url.searchParams.set("page", index.toString());
	window.history.replaceState({}, "", url);

	window.scrollTo({
		top: 0,
	});
};
</script>
<style lang="scss" scoped>
/* 去掉.vp-doc li + li 的 margin-top */
.pagination-container {
	margin-top: 60px;

	:deep(li) {
		margin-top: 0px;
	}
}

.mr-2 {
	margin-right: 2px;
}

.post-title {
	margin-bottom: 6px;
	border-top: 0px;
	position: relative;
	top: 0;
	left: 0;

	.post-date {
		position: absolute;
		top: -6px;
		left: -10px;

		z-index: -1;
		opacity: .12;
		font-size: 66px;
		font-weight: 900;
	}
}

.hollow-text {
  
  /* 设置文本颜色为透明 */
  color: var(--vp-c-bg);
  
	-webkit-text-stroke: 1px var(--vp-c-text-1);
}
</style>
