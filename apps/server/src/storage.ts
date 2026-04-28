import fs from "node:fs"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { config } from "./config"
import { fileRepo } from "./repositories"
import { createId, now } from "./utils"
import type { StoredFile } from "./types"

const ensureDir = (relativeDir: string) => {
  fs.mkdirSync(relativeDir, { recursive: true })
}

const dateParts = (timestamp: number) => {
  const date = new Date(timestamp)
  const yyyy = String(date.getUTCFullYear())
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return { yyyy, mm, dd }
}

export const initStorage = () => {
  ensureDir(config.uploadsDir)
  ensureDir(config.resultsDir)
}

export const saveUpload = async (deviceId: string, file: File, ttlMs: number): Promise<StoredFile> => {
  const timestamp = now()
  const { yyyy, mm, dd } = dateParts(timestamp)
  const relativeDir = path.join("uploads", yyyy, mm, dd)
  const absoluteDir = path.join(config.dataDir, relativeDir)
  ensureDir(absoluteDir)

  const ext = path.extname(file.name) || ".bin"
  const id = createId("file")
  const baseName = `${timestamp}_${id}${ext}`
  const absolutePath = path.join(absoluteDir, baseName)
  const relativePath = path.join(relativeDir, baseName)

  const bytes = new Uint8Array(await file.arrayBuffer())
  await writeFile(absolutePath, bytes)

  return fileRepo.create({
    id,
    deviceId,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    relativePath,
    createdAt: timestamp,
    expiresAt: timestamp + ttlMs
  })
}

export const getFileById = async (fileId: string) => fileRepo.findById(fileId)

export const resolveDataPath = (relativePath: string) => path.join(config.dataDir, relativePath)

export const saveResultFromUrl = async (taskId: string, sourceUrl: string) => {
  const timestamp = now()
  const { yyyy, mm, dd } = dateParts(timestamp)
  const relativeDir = path.join("results", yyyy, mm, dd)
  const absoluteDir = path.join(config.dataDir, relativeDir)
  ensureDir(absoluteDir)

  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to download upstream result: ${response.status}`)
  }

  const contentType = response.headers.get("content-type") || "image/png"
  const ext = contentType.includes("webp") ? ".webp" : contentType.includes("jpeg") ? ".jpg" : ".png"
  const fileName = `${timestamp}_${taskId}_result${ext}`
  const relativePath = path.join(relativeDir, fileName)
  const absolutePath = path.join(absoluteDir, fileName)
  await writeFile(absolutePath, new Uint8Array(await response.arrayBuffer()))

  return { relativePath, mimeType: contentType }
}

export const deleteIfExists = (relativePath: string | null) => {
  if (!relativePath) return
  const absolutePath = resolveDataPath(relativePath)
  if (fs.existsSync(absolutePath)) {
    fs.rmSync(absolutePath, { force: true })
  }
}
