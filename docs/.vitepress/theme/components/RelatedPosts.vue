<template>
  <div v-if="relatedPosts.length > 0" class="related-posts-sidebar">
    <div class="related-title">相关文章</div>
    <div class="related-posts-list">
      <div v-for="post in relatedPosts" :key="post.url" class="related-post-item">
        <a :href="post.url" class="post-title-link">
          <span class="post-title">{{ post.title }}</span>
        </a>
        <div v-if="post.excerpt" class="post-excerpt" v-html="post.excerpt"></div>
        <div class="post-info">
          <span class="post-date">{{ post.date.string }}</span>
          <span class="separator">·</span>
          <span class="post-time">{{ post.readingTime }}分钟</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useData } from 'vitepress'
import { data as posts } from '../posts.data.mts'

const route = useRoute()
const { frontmatter } = useData()

const maxRelated = 3
const minMatches = 1

const relatedPosts = computed(() => {
  const currentUrl = route.path
  const currentTags = frontmatter.value.tags || []

  if (currentTags.length === 0) return []

  // 计算每篇文章的标签匹配数
  const scored = posts
    .filter(post => post.url !== currentUrl) // 排除当前文章
    .filter(post => post.tags && post.tags.length > 0) // 排除没有标签的文章
    .map(post => {
      const matchCount = post.tags.filter(tag =>
        currentTags.includes(tag)
      ).length
      return { post, matchCount }
    })
    .filter(item => item.matchCount >= minMatches) // 最少匹配数
    .sort((a, b) => {
      // 按匹配数排序（降序），匹配数相同则按日期排序
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount
      }
      return b.post.date.time - a.post.date.time
    })

  return scored.slice(0, maxRelated).map(item => item.post)
})
</script>

<style scoped>
.related-posts-sidebar {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.related-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.related-posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.related-post-item {
  display: block;
  padding: 8px 0;
}

.post-title-link {
  text-decoration: none !important;
  display: inline-block;
  margin-bottom: 8px;
  border-bottom: none !important;
}

.post-title-link:hover,
.post-title-link:active,
.post-title-link:focus {
  text-decoration: none !important;
  border-bottom: none !important;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.5;
  background-image: linear-gradient(to right, var(--vp-c-brand-1) 0%, var(--vp-c-brand-1) 100%);
  background-size: 0 1px;
  background-repeat: no-repeat;
  background-position: left bottom;
  transition: background-size 0.3s ease, color 0.3s ease;
  text-decoration: none !important;
  border-bottom: none !important;
}

.post-title-link:hover .post-title {
  color: var(--vp-c-brand-1);
  background-size: 100% 1px;
}

.post-excerpt {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.separator {
  color: var(--vp-c-text-3);
}

.post-date,
.post-time {
  color: var(--vp-c-text-3);
}
</style>
