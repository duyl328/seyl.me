<template>
  <t-button
      v-if="isPosts && !frontmatter.isNoBackBtn"
      theme="default"
      variant="dashed"
      style="margin-bottom: 10px"
      @click="goBack"
  >
    <template #icon>
      <RollbackIcon/>
    </template>
    {{ '返回上一页' }}
  </t-button>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useData } from 'vitepress'
import { RollbackIcon } from 'tdesign-icons-vue-next'

const route = useRoute()
const isPosts = computed(() => route.path.startsWith('/posts'))
const { frontmatter } = useData()

function goBack () {
  if (typeof window === 'undefined') return
  if (window.history.length <= 1) {
    location.href = '/'
  } else {
    window.history.back()
  }
}
</script>
<style scoped>
.img-container {
  height: 105px;
  width: 100px;
}

img {
  height: 100px;
  border-radius: 5px;
  margin-top: 5px;
}
</style>
