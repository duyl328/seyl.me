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
          @mouseenter="photo.videoSrc && startHoverVideo($event, photo)"
          @mouseleave="photo.videoSrc && stopHoverVideo($event)"
          @touchstart.passive="photo.videoSrc && startLongPress($event, photo)"
          @touchend.passive="photo.videoSrc && stopLongPress($event, photo)"
          @touchmove.passive="cancelLongPress()"
        >
          <div class="image-shell" :class="{ loaded: loadedMap[photo.src] }">
            <img
              :src="photo.src"
              :alt="photo.title"
              loading="lazy"
              decoding="async"
              @load="handleLoaded(photo.src)"
            >
            <span v-if="photo.videoSrc" class="live-badge">LIVE</span>
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
        :key="previewKey"
        @close="onPreviewClose"
        @index-change="onPreviewIndexChange"
      />
      <TDesignDark />
    </t-config-provider>

    <!-- Live Photo 预览覆盖层（hint 提示，不拦截点击） -->
    <Teleport to="body">
      <div
        v-if="liveOverlay.visible && !liveOverlay.playing"
        class="live-overlay-hint-bar"
      >
        <span class="live-overlay-badge">LIVE</span>
        <span class="live-overlay-tip">点击照片播放</span>
      </div>
    </Teleport>
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
const previewKey = ref(0)

// 当前预览列表对应的 photo 对象（用于查找 videoSrc）
const previewPhotos = ref<GalleryPhoto[]>([])

function openPreview (photo: GalleryPhoto) {
  previewPhotos.value = visiblePhotos.value
  previewImages.value = visiblePhotos.value.map(p => p.src)
  previewIndex.value = visiblePhotos.value.findIndex(p => p.src === photo.src)
  previewKey.value++
  showPreview.value = true
  document.body.style.overflow = 'hidden'
  nextTickShowLiveOverlay(previewIndex.value)
  // 绑定滑动手势到 viewer 容器
  setTimeout(attachSwipeListeners, 100)
}

function onPreviewClose () {
  hideLiveOverlay()
  detachSwipeListeners()
  showPreview.value = false
  document.body.style.overflow = ''
}

// 预览左右滑动切换
let swipeTouchStartX = 0
let swipeViewerEl: HTMLElement | null = null

function attachSwipeListeners () {
  const el = document.querySelector('.t-image-viewer__modal') as HTMLElement | null
  if (!el) return
  swipeViewerEl = el
  el.addEventListener('touchstart', onSwipeTouchStart, { passive: true })
  el.addEventListener('touchend', onSwipeTouchEnd, { passive: true })
}

function detachSwipeListeners () {
  if (swipeViewerEl) {
    swipeViewerEl.removeEventListener('touchstart', onSwipeTouchStart)
    swipeViewerEl.removeEventListener('touchend', onSwipeTouchEnd)
    swipeViewerEl = null
  }
}

function onSwipeTouchStart (e: TouchEvent) {
  swipeTouchStartX = e.touches[0].clientX
}

function onSwipeTouchEnd (e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - swipeTouchStartX
  if (Math.abs(dx) < 50) return
  if (dx < 0) {
    const next = previewIndex.value + 1
    if (next < previewImages.value.length) {
      previewIndex.value = next
      onPreviewIndexChange(next)
    }
  } else {
    const prev = previewIndex.value - 1
    if (prev >= 0) {
      previewIndex.value = prev
      onPreviewIndexChange(prev)
    }
  }
}

function onPreviewIndexChange (index: number) {
  previewIndex.value = index
  nextTickShowLiveOverlay(index)
}

// Live Photo 预览
const liveOverlay = reactive({
  visible: false,
  playing: false,
})

let liveVideoEl: HTMLVideoElement | null = null
let liveImgEl: HTMLImageElement | null = null
let liveClickHandler: (() => void) | null = null

function getViewerImageSize (): { width: number; height: number } | null {
  const img = document.querySelector('.t-image-viewer__modal-image') as HTMLImageElement | null
  if (!img) return null
  const rect = img.getBoundingClientRect()
  if (rect.width > 0 && rect.height > 0) return { width: rect.width, height: rect.height }
  return null
}

function nextTickShowLiveOverlay (index: number) {
  hideLiveOverlay()
  const photo = previewPhotos.value[index]
  if (!photo?.videoSrc) return

  let attempts = 0
  const tryAttach = () => {
    // TDesign 渲染两个 img，取可见的那个（display: block）
    const imgs = document.querySelectorAll('.t-image-viewer__modal-image') as NodeListOf<HTMLImageElement>
    const img = Array.from(imgs).find(el => el.style.display !== 'none') ?? null
    const size = img ? img.getBoundingClientRect() : null
    if (img && size && size.width > 0) {
      liveImgEl = img
      liveOverlay.visible = true
      liveOverlay.playing = false

      // 给 TDesign 的图片加点击事件
      liveClickHandler = () => playLiveOnce(photo.videoSrc!, img)
      img.style.cursor = 'pointer'
      img.addEventListener('click', liveClickHandler)
    } else if (attempts++ < 20) {
      setTimeout(tryAttach, 50)
    }
  }
  setTimeout(tryAttach, 50)
}

function playLiveOnce (videoSrc: string, img: HTMLImageElement) {
  if (liveOverlay.playing) return
  liveOverlay.playing = true

  // 记录所有 img 播放前的 display 状态
  const siblings = Array.from(
    img.parentElement?.querySelectorAll('.t-image-viewer__modal-image') ?? []
  ) as HTMLImageElement[]
  const prevDisplay = siblings.map(el => el.style.display)

  // 创建 video 替换 img
  const video = document.createElement('video')
  video.src = videoSrc
  video.style.cssText = img.style.cssText
  video.style.cursor = 'default'
  video.className = img.className
  video.muted = true
  video.playsInline = true
  video.autoplay = true
  liveVideoEl = video

  // 隐藏所有 img
  siblings.forEach(el => { el.style.display = 'none' })
  img.parentElement?.appendChild(video)

  video.addEventListener('ended', () => {
    // 恢复播放前的 display 状态
    siblings.forEach((el, i) => { el.style.display = prevDisplay[i] })
    video.remove()
    liveVideoEl = null
    liveOverlay.playing = false
  })

  video.play().catch(() => {})
}

function hideLiveOverlay () {
  if (liveImgEl && liveClickHandler) {
    liveImgEl.removeEventListener('click', liveClickHandler)
    liveImgEl.style.cursor = ''
    liveImgEl = null
    liveClickHandler = null
  }
  if (liveVideoEl) {
    liveVideoEl.pause()
    liveVideoEl.remove()
    liveVideoEl = null
  }
  liveOverlay.visible = false
  liveOverlay.playing = false
}

// 长按播放 Live（移动端）
let hoverVideo: HTMLVideoElement | null = null

function startHoverVideo (event: MouseEvent, photo: GalleryPhoto) {
  const figure = event.currentTarget as HTMLElement
  const shell = figure.querySelector('.image-shell') as HTMLElement
  if (!shell || !photo.videoSrc) return

  const video = document.createElement('video')
  video.src = photo.videoSrc
  video.className = 'hover-video'
  video.muted = true
  video.loop = true
  video.playsInline = true
  video.autoplay = true
  shell.appendChild(video)
  hoverVideo = video
  video.play().catch(() => {})
}

function stopHoverVideo (event: MouseEvent) {
  const figure = event.currentTarget as HTMLElement
  const shell = figure.querySelector('.image-shell') as HTMLElement
  if (!shell) return
  const video = shell.querySelector('.hover-video')
  if (video) {
    shell.removeChild(video)
  }
  hoverVideo = null
}

// 长按播放 Live（移动端）
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function startLongPress (event: TouchEvent, photo: GalleryPhoto) {
  cancelLongPress()
  const figure = event.currentTarget as HTMLElement
  const shell = figure.querySelector('.image-shell') as HTMLElement
  if (!shell || !photo.videoSrc) return

  longPressTimer = setTimeout(() => {
    const video = document.createElement('video')
    video.src = photo.videoSrc!
    video.className = 'hover-video'
    video.muted = true
    video.loop = true
    video.playsInline = true
    shell.appendChild(video)
    hoverVideo = video
    video.play().catch(() => {})
  }, 300)
}

function stopLongPress (event: TouchEvent, photo: GalleryPhoto) {
  cancelLongPress()
  if (hoverVideo) {
    hoverVideo.remove()
    hoverVideo = null
  }
}

function cancelLongPress () {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
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
  hideLiveOverlay()
  detachSwipeListeners()
  document.body.style.overflow = ''
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
  /* 禁止长按选中文字和触发 iOS 系统菜单 */
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
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
  object-fit: contain !important;
}

.photo-wall :deep(.t-image-viewer__modal) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-wall :deep(.t-image-viewer__modal-mask) {
  background: rgba(0, 0, 0, 0.96) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Live Photo 徽标 */
.live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  pointer-events: none;
  z-index: 2;
}

/* 悬停视频覆盖在图片上 */
.hover-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
  z-index: 1;
}

/* 预览 Live 提示条 */
.live-overlay-hint-bar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3001;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.live-overlay-badge {
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  backdrop-filter: blur(4px);
}

.live-overlay-tip {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}
</style>
