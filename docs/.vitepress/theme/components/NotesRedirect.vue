<script setup lang="ts">
import { useRouter } from 'vitepress'
import { onMounted } from 'vue'
import autoSidebar from '../../autoSidebar'

const router = useRouter()

onMounted(() => {
  const prefix = '/notes/'
  const sideBarElement = autoSidebar[prefix]
  const firstGroup = sideBarElement[0]
  const firstItemLink = firstGroup.items[0].link

  // link 已经是绝对路径（以 / 开头），直接使用
  if (router.route.path !== firstItemLink) {
    window.location.href = firstItemLink
  }
})
</script>

<template>
  <div class="notes-loading">
    <p>正在跳转到笔记页面...</p>
  </div>
</template>

<style scoped>
.notes-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--vp-c-text-2);
}
</style>
