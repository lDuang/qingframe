export const SIZE_OPTIONS = ["1:1", "4:5", "3:4", "16:9", "9:16"] as const

export const sizeMap: Record<(typeof SIZE_OPTIONS)[number], string> = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "3:4": "1024x1365",
  "16:9": "1536x864",
  "9:16": "864x1536",
}

export const reverseSizeMap = Object.fromEntries(
  Object.entries(sizeMap).map(([ratio, size]) => [size, ratio])
) as Record<string, (typeof SIZE_OPTIONS)[number]>

export const qualityLabelMap: Record<string, string> = {
  auto: "自动",
  high: "高质量",
  medium: "标准",
}

export const formatTime = (value: number) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
