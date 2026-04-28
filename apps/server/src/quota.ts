import { config } from "./config"
import { rateLimitRepo } from "./repositories"
import { now } from "./utils"

const getQuotaWindow = () => {
  const date = new Date()
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

export const getQuotaState = async (ip: string, visitorId: string) => {
  const quotaKey = `quota:${getQuotaWindow()}:${ip}:${visitorId}`
  const cooldownKey = `cooldown:${ip}:${visitorId}`
  const quota = await rateLimitRepo.findByKey(quotaKey)
  const cooldown = await rateLimitRepo.findByKey(cooldownKey)
  const remainingToday = Math.max(0, config.DAILY_QUOTA - (quota?.count ?? 0))
  const retryAfterSeconds = cooldown?.cooldownUntil
    ? Math.max(0, Math.ceil((cooldown.cooldownUntil - now()) / 1000))
    : 0

  return {
    quotaKey,
    cooldownKey,
    quotaCount: quota?.count ?? 0,
    remainingToday,
    retryAfterSeconds,
  }
}

export const consumeQuota = async (ip: string, visitorId: string) => {
  const timestamp = now()
  const windowStart = getQuotaWindow()
  const state = await getQuotaState(ip, visitorId)

  await rateLimitRepo.upsert({
    key: state.quotaKey,
    scope: "daily",
    count: state.quotaCount + 1,
    windowStart,
    cooldownUntil: null,
    updatedAt: timestamp,
  })

  await rateLimitRepo.upsert({
    key: state.cooldownKey,
    scope: "cooldown",
    count: 0,
    windowStart,
    cooldownUntil: timestamp + config.COOLDOWN_SECONDS * 1000,
    updatedAt: timestamp,
  })

  return {
    dailyLimit: config.DAILY_QUOTA,
    remainingToday: Math.max(0, config.DAILY_QUOTA - (state.quotaCount + 1)),
    retryAfterSeconds: config.COOLDOWN_SECONDS,
  }
}

export const toQuotaPayload = (quota: { remainingToday: number; retryAfterSeconds: number }) => ({
  dailyLimit: config.DAILY_QUOTA,
  remainingToday: quota.remainingToday,
  retryAfterSeconds: quota.retryAfterSeconds,
})
