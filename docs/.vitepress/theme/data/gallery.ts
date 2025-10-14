export type GalleryPhoto = {
  src: string
  filename: string
  year: string
  dateLabel: string
  timeLabel?: string
  title: string
}

const photoModules = import.meta.glob(
  '../../../../photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

function parseMeta (filepath: string, src: string): GalleryPhoto {
  const filename = filepath.split('/').pop() || src
  const baseName = filename.replace(/\.[^.]+$/, '')
  const match = baseName.match(
    /^(\d{4})-(\d{2})-(\d{2})\s*(\d{2})-(\d{2})-(\d{2})/,
  )

  if (match) {
    const [, y, m, d, hh, mm, ss] = match
    return {
      src,
      filename,
      year: y,
      dateLabel: `${y}-${m}-${d}`,
      timeLabel: `${hh}:${mm}:${ss}`,
      title: `${y}-${m}-${d} ${hh}:${mm}`,
    }
  }

  return {
    src,
    filename,
    year: '未分组',
    dateLabel: baseName,
    title: baseName,
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
