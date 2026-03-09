<template>
  <div v-if="isPost && readingTime" class="post-meta">
    <span class="reading-time">
      <t-icon name="time" />
      预计阅读 {{ readingTime }} 分钟
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import { data as posts } from '../posts.data.mts'

const route = useRoute()

const isPost = computed(() => route.path.startsWith('/posts'))

const readingTime = computed(() => {
  const currentPost = posts.find(post => post.url === route.path)
  return currentPost?.readingTime
})
</script>

<style scoped>
.post-meta {
  padding: 12px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.reading-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.reading-time :deep(.t-icon) {
  font-size: 16px;
}
</style>
