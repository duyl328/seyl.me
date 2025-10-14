<template>
  <section class="photo-wall">
    <header class="gallery-bar">
      <h1 class="gallery-title">相册</h1>
      <p class="gallery-subtitle">点击任意照片即可调用全屏预览</p>
      <nav class="gallery-filter" aria-label="年份筛选">
        <button
          v-for="year in filters"
          :key="year"
          type="button"
          class="filter-chip"
          :class="{ active: activeYear === year }"
          @click="activeYear = year"
        >
          {{ year }}
        </button>
      </nav>
    </header>

    <div ref="gridContainer" class="gallery-grid" :style="{ gap: `${columnGap}px` }">
      <div
        v-for="(column, index) in columns"
        :key="index"
        class="gallery-column"
      >
        <figure
          v-for="photo in column"
          :key="photo.src"
          class="photo-card"
          @click="openPreview(photo)"
        >
          <div class="image-shell" :class="{ loaded: loadedMap[photo.src] }">
            <img
              :src="photo.src"
              :alt="photo.title"
              loading="lazy"
              decoding="async"
              @load="handleLoaded(photo.src)"
            >
          </div>
        </figure>
      </div>
    </div>

    <div ref="sentinel" class="gallery-sentinel" aria-hidden="true" />

    <!-- 图片预览器 -->
    <t-config-provider :global-config="globalConfig">
      <t-image-viewer
        v-model:visible="showPreview"
        :images="previewImages"
        :default-index="previewIndex"
        :key="previewIndex"
        @close="showPreview = false"
      />
      <TDesignDark />
    </t-config-provider>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import zhConfig from 'tdesign-vue-next/es/locale/zh_CN'
import type { GalleryPhoto } from '../data/gallery'
import { galleryPhotos, galleryYears } from '../data/gallery'
import TDesignDark from './TDesignDark.vue'

const globalConfig = ref(zhConfig)

const filters = ['全部', ...galleryYears]
const activeYear = ref(filters[0])

const BATCH_SIZE = 30
const MIN_COLUMN_WIDTH = 350
const COLUMN_GAP = 20
const hasWindow = typeof window !== 'undefined'

const filteredPhotos = computed(() =>
  activeYear.value === '全部'
    ? galleryPhotos
    : galleryPhotos.filter((item) => item.year === activeYear.value),
)

const displayCount = ref(BATCH_SIZE)

const visiblePhotos = computed(() =>
  filteredPhotos.value.slice(0, displayCount.value),
)

const loadedMap = reactive<Record<string, boolean>>({})

function handleLoaded (src: string) {
  loadedMap[src] = true
}

// 图片预览
const showPreview = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

function openPreview (photo: GalleryPhoto) {
  // 只预览已经渲染的照片
  previewImages.value = visiblePhotos.value.map(p => p.src)
  previewIndex.value = visiblePhotos.value.findIndex(p => p.src === photo.src)
  showPreview.value = true
}

function loadMore () {
  if (displayCount.value >= filteredPhotos.value.length) return
  displayCount.value = Math.min(
    displayCount.value + BATCH_SIZE,
    filteredPhotos.value.length,
  )
}

// 计算列数
const columnCount = ref(1)
const columnGap = ref(COLUMN_GAP)
const gridContainer = ref<HTMLElement | null>(null)

function calculateColumnCount () {
  if (!hasWindow || !gridContainer.value) return 1
  const containerWidth = gridContainer.value.clientWidth
  const count = Math.floor((containerWidth + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP))
  return Math.max(1, Math.min(count, 4))
}

function updateColumnCount () {
  columnCount.value = calculateColumnCount()
}

// 分配照片到列 - 使用贪心算法实现真正的瀑布流
const columns = computed(() => {
  const cols: typeof visiblePhotos.value[] = Array.from(
    { length: columnCount.value },
    () => [],
  )

  // 记录每列的照片数量（简易高度估算）
  const columnHeights = Array(columnCount.value).fill(0)

  visiblePhotos.value.forEach((photo) => {
    // 找到当前最短的列
    const minHeight = Math.min(...columnHeights)
    const shortestColumnIndex = columnHeights.indexOf(minHeight)

    // 将照片添加到最短的列
    cols[shortestColumnIndex].push(photo)
    columnHeights[shortestColumnIndex]++
  })

  return cols
})

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null

function setupObserver () {
  if (!sentinel.value) return
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      })
    },
    {
      rootMargin: '200px',
    },
  )
  observer.observe(sentinel.value)
}

function setupResizeObserver () {
  if (!hasWindow || !gridContainer.value) return
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    // 防抖优化
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    resizeTimeout = setTimeout(() => {
      updateColumnCount()
    }, 150)
  })
  resizeObserver.observe(gridContainer.value)
}

onMounted(() => {
  if (hasWindow) {
    window.requestAnimationFrame(() => {
      updateColumnCount()
      setupResizeObserver()
    })
  }
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  resizeObserver?.disconnect()
  resizeObserver = null
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }
})

watch(filteredPhotos, () => {
  displayCount.value = Math.min(BATCH_SIZE, filteredPhotos.value.length)
  if (hasWindow) {
    window.requestAnimationFrame(() => setupObserver())
  } else {
    setupObserver()
  }
})

watch(
  () => sentinel.value,
  (el) => {
    if (el) {
      setupObserver()
    }
  },
)
</script>

<style>
.photo-wall {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1800px;
  width: 100%;
  margin: 0 auto;
  padding: 24px clamp(16px, 2vw, 32px) 0;
  box-sizing: border-box;
}

.vp-doc .photo-wall {
  max-width: 1800px !important;
}

/* 突破 VitePress 内容区域宽度限制 */
:deep(.vp-doc) {
  max-width: 100% !important;
}

:deep(.content-container) {
  max-width: 100% !important;
}

/* 相册页面导航栏样式调整 */
.gallery-page .VPNav {
  background: var(--vp-c-bg) !important;
  backdrop-filter: none !important;
}

.gallery-page .VPNavBar {
  background: var(--vp-c-bg) !important;
  backdrop-filter: none !important;
  border-bottom: 1px solid var(--vp-c-divider);
}

.gallery-page .VPNavBar .container,
.gallery-page .VPNavBar .content {
  max-width: 1800px !important;
}

.gallery-page .VPNavBar .wrapper {
  max-width: 1800px !important;
  margin: 0 auto !important;
  padding-inline: clamp(16px, 2vw, 32px) !important;
}

.gallery-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gallery-title {
  margin: 0;
  font-size: clamp(24px, 4vw, 36px);
}

.gallery-subtitle {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
}

.gallery-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.filter-chip:hover {
  border-color: var(--vp-c-brand-1);
}

.filter-chip.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

.gallery-grid {
  display: flex;
  align-items: flex-start;
}

.gallery-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2vw, 24px);
}

.photo-card {
  width: 100%;
  margin: 0;
  cursor: pointer;
}

.image-shell {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.02));
  transition: box-shadow 0.25s ease;
}

.image-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.05);
  transition: opacity 0.3s ease;
}

.image-shell.loaded::after {
  opacity: 0;
}

.image-shell:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.image-shell img {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.32s ease, transform 0.25s ease;
  cursor: pointer;
}

.image-shell:active img {
  transform: scale(0.98);
}

.image-shell.loaded img {
  opacity: 1;
}

.gallery-sentinel {
  width: 100%;
  height: 1px;
}

/* 图片预览器样式优化 */
.photo-wall :deep(.t-image-viewer__modal-pic) {
  max-width: 95vw !important;
  max-height: 95vh !important;
}

.photo-wall :deep(.t-image-viewer__modal-image) {
  max-width: 95vw !important;
  max-height: 95vh !important;
  object-fit: contain;
}

.photo-wall :deep(.t-image-viewer__modal) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
