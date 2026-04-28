import { pgTable, text, integer, bigint } from "drizzle-orm/pg-core"

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  relativePath: text("relative_path").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull()
})

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  toolId: text("tool_id").notNull(),
  status: text("status", { enum: ["queued", "processing", "succeeded", "failed", "expired"] }).notNull(),
  inputJson: text("input_json").notNull(),
  sourceFileIdsJson: text("source_file_ids_json").notNull(),
  resultRelativePath: text("result_relative_path"),
  resultMimeType: text("result_mime_type"),
  provider: text("provider").notNull(),
  providerModel: text("provider_model").notNull(),
  providerRequestId: text("provider_request_id"),
  providerRawJson: text("provider_raw_json"),
  errorMessage: text("error_message"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull()
})

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  scope: text("scope").notNull(),
  count: integer("count").notNull(),
  windowStart: text("window_start").notNull(),
  cooldownUntil: bigint("cooldown_until", { mode: "number" }),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull()
})
