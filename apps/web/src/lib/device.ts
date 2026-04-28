const DEVICE_KEY = "qingframe.device-id"

export const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  localStorage.setItem(DEVICE_KEY, created)
  return created
}
