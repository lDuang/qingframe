import { and, asc, desc, eq, gt, lte, ne } from "drizzle-orm"
import { db } from "./database"
import { files, rateLimits, tasks } from "./schema"
import type { RateLimitRecord, StoredFile, TaskRecord, TaskStatus } from "./types"

export const fileRepo = {
  async create(file: StoredFile) {
    await db.insert(files).values({
      id: file.id,
      deviceId: file.deviceId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      relativePath: file.relativePath,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt
    })
    return file
  },
  async findById(id: string) {
    return (await db.query.files.findFirst({ where: eq(files.id, id) })) ?? null
  },
  listExpired(timestamp: number) {
    return db.query.files.findMany({ where: lte(files.expiresAt, timestamp) })
  },
  async deleteExpired(timestamp: number) {
    await db.delete(files).where(lte(files.expiresAt, timestamp))
  }
}

export const taskRepo = {
  async create(task: TaskRecord) {
    await db.insert(tasks).values({ ...task })
    return task
  },
  async findById(id: string) {
    return (await db.query.tasks.findFirst({ where: eq(tasks.id, id) })) ?? null
  },
  listRecentForDevice(deviceId: string, timestamp: number, limit: number) {
    return db.query.tasks.findMany({
      where: and(eq(tasks.deviceId, deviceId), gt(tasks.expiresAt, timestamp)),
      orderBy: [desc(tasks.createdAt)],
      limit
    })
  },
  async findNextQueued(timestamp: number) {
    return (await db.query.tasks.findFirst({
      where: and(eq(tasks.status, "queued"), gt(tasks.expiresAt, timestamp)),
      orderBy: [asc(tasks.createdAt)]
    })) ?? null
  },
  async updateProgress(input: {
    id: string
    status: TaskStatus
    resultRelativePath?: string | null
    resultMimeType?: string | null
    providerRequestId?: string | null
    providerRawJson?: string | null
    errorMessage?: string | null
    updatedAt: number
  }) {
    await db.update(tasks)
      .set({
        status: input.status,
        resultRelativePath: input.resultRelativePath ?? null,
        resultMimeType: input.resultMimeType ?? null,
        providerRequestId: input.providerRequestId ?? null,
        providerRawJson: input.providerRawJson ?? null,
        errorMessage: input.errorMessage ?? null,
        updatedAt: input.updatedAt
      })
      .where(eq(tasks.id, input.id))
  },
  async expire(timestamp: number) {
    await db.update(tasks)
      .set({ status: "expired", updatedAt: timestamp })
      .where(and(lte(tasks.expiresAt, timestamp), ne(tasks.status, "expired")))
  },
  listExpiredWithResults(timestamp: number) {
    return db.query.tasks.findMany({
      where: and(lte(tasks.expiresAt, timestamp), ne(tasks.resultRelativePath, null))
    })
  },
  async deleteExpired(timestamp: number) {
    await db.delete(tasks).where(lte(tasks.expiresAt, timestamp))
  }
}

export const rateLimitRepo = {
  async findByKey(key: string) {
    return (await db.query.rateLimits.findFirst({ where: eq(rateLimits.key, key) })) ?? null
  },
  async upsert(record: RateLimitRecord) {
    const existing = await this.findByKey(record.key)
    if (existing) {
      await db
        .update(rateLimits)
        .set({
          scope: record.scope,
          count: record.count,
          windowStart: record.windowStart,
          cooldownUntil: record.cooldownUntil,
          updatedAt: record.updatedAt,
        })
        .where(eq(rateLimits.key, record.key))
      return
    }

    await db.insert(rateLimits).values(record)
  },
}
