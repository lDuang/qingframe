import dotenv from "dotenv"
import path from "node:path"
import { z } from "zod"

const isMigrateOnly = process.argv.includes("--migrate-only")
const workspaceRoot = path.resolve(process.cwd(), "../..")

dotenv.config({
  path: path.resolve(workspaceRoot, ".env")
})

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATA_DIR: z.string().default("./data"),
  DATABASE_URL: z.string().url().optional(),
  TOOLS_CONFIG_PATH: z.string().default("../../config/tools.json"),
  API_BASE_URL: z.string().optional(),
  BASE_API_KEY: z.string().optional(),
  API_MODEL: z.string().default("gpt-image-2"),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  DAILY_QUOTA: z.coerce.number().int().positive().default(5),
  COOLDOWN_SECONDS: z.coerce.number().int().positive().default(30),
  TASK_TTL_HOURS: z.coerce.number().int().positive().default(6),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(15728640),
  WORKER_POLL_MS: z.coerce.number().int().positive().default(5000),
  CLEANUP_POLL_MS: z.coerce.number().int().positive().default(600000)
})

const parsed = envSchema.parse(process.env)
const cwd = process.cwd()

if (!parsed.DATABASE_URL) {
  throw new Error("DATABASE_URL is required")
}

if (!isMigrateOnly) {
  if (!parsed.API_BASE_URL) {
    throw new Error("API_BASE_URL is required")
  }
  z.string().url().parse(parsed.API_BASE_URL)
  if (!parsed.BASE_API_KEY) {
    throw new Error("BASE_API_KEY is required")
  }
}

export const config = {
  ...parsed,
  dataDir: path.resolve(cwd, parsed.DATA_DIR),
  databaseUrl: parsed.DATABASE_URL,
  toolsConfigPath: path.resolve(cwd, parsed.TOOLS_CONFIG_PATH),
  uploadsDir: path.resolve(cwd, parsed.DATA_DIR, "uploads"),
  resultsDir: path.resolve(cwd, parsed.DATA_DIR, "results")
}
