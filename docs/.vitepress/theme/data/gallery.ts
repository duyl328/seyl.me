export type GalleryPhoto = {
  src: string
  filename: string
  year: string
  dateLabel: string
  timeLabel?: string
  title: string
  videoSrc?: string  // Live Photo 配对的 MP4
}

const photoModules = import.meta.glob(
  '../../../../photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

const videoModules = import.meta.glob(
  '../../../../photos/*.{mp4,MP4}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

// 建立 stem -> videoSrc 的映射
const videoMap: Record<string, string> = {}
for (const [filepath, src] of Object.entries(videoModules)) {
  const stem = (filepath.split('/').pop() || '').replace(/\.[^.]+$/, '')
  videoMap[stem] = src
}

function parseMeta (filepath: string, src: string): GalleryPhoto {
  const filename = filepath.split('/').pop() || src
  const baseName = filename.replace(/\.[^.]+$/, '')
  const match = baseName.match(
    /^(\d{4})-(\d{2})-(\d{2})\s*(\d{2})-(\d{2})-(\d{2})/,
  )

  const videoSrc = videoMap[baseName]

  if (match) {
    const [, y, m, d, hh, mm, ss] = match
    return {
      src,
      filename,
      year: y,
      dateLabel: `${y}-${m}-${d}`,
      timeLabel: `${hh}:${mm}:${ss}`,
      title: `${y}-${m}-${d} ${hh}:${mm}`,
      videoSrc,
    }
  }

  return {
    src,
    filename,
    year: '未分组',
    dateLabel: baseName,
    title: baseName,
    videoSrc,
  }
}

export const galleryPhotos: GalleryPhoto[] = Object.entries(photoModules)
  .map(([filepath, src]) => parseMeta(filepath, src))
  .sort((a, b) => b.filename.localeCompare(a.filename))

const orderedYears = Array.from(
  new Set(galleryPhotos.map((item) => item.year)),
).sort((a, b) => b.localeCompare(a))

export const galleryYears = orderedYears.filter((year) => year !== '未分组')
if (orderedYears.includes('未分组')) {
  galleryYears.push('未分组')
}
