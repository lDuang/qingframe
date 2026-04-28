import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { config } from "./config"
import { runMigrations } from "./database"
import { taskRepo } from "./repositories"
import { consumeQuota, getQuotaState, toQuotaPayload } from "./quota"
import { initStorage, resolveDataPath, saveUpload } from "./storage"
import { createQueuedTask, publicToolShape, serializeTask, taskInputSchema, validateTaskRequest } from "./task-service"
import { loadTools } from "./tools"
import { now } from "./utils"
import { ensureVisitor } from "./visitor"
import { startWorker } from "./worker"

const app = new Hono()

const requireDeviceId = async (c: any, next: any) => {
  const deviceId = c.req.header("x-device-id")
  if (!deviceId) {
    return c.json({ error: { code: "MISSING_DEVICE_ID", message: "x-device-id header is required" } }, 400)
  }
  c.set("deviceId", deviceId)
  await next()
}

app.use("/api/files", requireDeviceId)
app.use("/api/tasks", requireDeviceId)
app.use("/api/tasks/*", requireDeviceId)

app.get("/api/health", (c) => c.json({ ok: true }))

app.get("/api/tools", async (c) => {
  const visitor = ensureVisitor(c)
  const quota = await getQuotaState(visitor.ip, visitor.visitorId)

  return c.json({
    tools: loadTools().map(publicToolShape),
    quota: toQuotaPayload(quota),
  })
})

app.post("/api/files", async (c) => {
  const deviceId = c.get("deviceId") as string
  const formData = await c.req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return c.json({ error: { code: "INVALID_FILE", message: "file is required" } }, 400)
  }
  if (file.size > config.MAX_UPLOAD_BYTES) {
    return c.json({ error: { code: "FILE_TOO_LARGE", message: `max file size is ${config.MAX_UPLOAD_BYTES} bytes` } }, 400)
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    return c.json({ error: { code: "UNSUPPORTED_FILE", message: "only jpg, png, and webp are allowed" } }, 400)
  }

  const saved = await saveUpload(deviceId, file, config.TASK_TTL_HOURS * 60 * 60 * 1000)
  return c.json({ file: saved }, 201)
})

app.post("/api/tasks", async (c) => {
  const deviceId = c.get("deviceId") as string
  const visitor = ensureVisitor(c)
  const body = taskInputSchema.safeParse(await c.req.json())
  if (!body.success) {
    return c.json({ error: { code: "BAD_REQUEST", message: body.error.flatten() } }, 400)
  }

  const validation = await validateTaskRequest({
    deviceId,
    toolId: body.data.toolId,
    fileIds: body.data.fileIds,
  })
  if ("error" in validation) {
    return c.json({ error: validation.error }, validation.status)
  }

  const quota = await getQuotaState(visitor.ip, visitor.visitorId)
  if (quota.retryAfterSeconds > 0) {
    return c.json(
      {
        error: { code: "COOLDOWN_ACTIVE", message: `retry after ${quota.retryAfterSeconds} seconds` },
        quota: toQuotaPayload(quota),
      },
      429
    )
  }
  if (quota.remainingToday <= 0) {
    return c.json(
      {
        error: { code: "DAILY_LIMIT_REACHED", message: "daily quota reached" },
        quota: toQuotaPayload({ remainingToday: 0, retryAfterSeconds: 0 }),
      },
      429
    )
  }

  const task = await createQueuedTask({
    deviceId,
    toolId: validation.tool.id,
    inputs: body.data.inputs,
    fileIds: body.data.fileIds,
  })
  const updatedQuota = await consumeQuota(visitor.ip, visitor.visitorId)

  return c.json(
    {
      task: serializeTask(task),
      quota: updatedQuota,
    },
    202
  )
})

app.get("/api/tasks", async (c) => {
  const deviceId = c.get("deviceId") as string
  const limit = Math.min(Number(c.req.query("limit") || "10"), 30)
  const tasks = await taskRepo.listRecentForDevice(deviceId, now(), limit)
  return c.json({ tasks: tasks.map(serializeTask) })
})

app.get("/api/tasks/:id", async (c) => {
  const deviceId = c.get("deviceId") as string
  const task = await taskRepo.findById(c.req.param("id"))
  if (!task) {
    return c.json({ error: { code: "TASK_NOT_FOUND", message: "task not found" } }, 404)
  }
  if (task.deviceId !== deviceId) {
    return c.json({ error: { code: "FORBIDDEN", message: "task does not belong to this device" } }, 403)
  }
  return c.json({ task: serializeTask(task) })
})

app.get("/api/tasks/:id/result", async (c) => {
  const deviceId = c.get("deviceId") as string
  const task = await taskRepo.findById(c.req.param("id"))
  if (!task) {
    return c.json({ error: { code: "TASK_NOT_FOUND", message: "task not found" } }, 404)
  }
  if (task.deviceId !== deviceId) {
    return c.json({ error: { code: "FORBIDDEN", message: "task does not belong to this device" } }, 403)
  }
  if (task.status !== "succeeded" || !task.resultRelativePath || !task.resultMimeType) {
    return c.json({ error: { code: "RESULT_UNAVAILABLE", message: "result is not ready" } }, 409)
  }

  return new Response(await readFile(resolveDataPath(task.resultRelativePath)), {
    headers: {
      "Content-Type": task.resultMimeType,
      "Cache-Control": "private, max-age=60",
    },
  })
})

app.use("*", serveStatic({ root: "./public" }))
app.get("*", async () => {
  const filePath = path.join(process.cwd(), "public", "index.html")
  return new Response(await readFile(filePath), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
})

const bootstrap = async () => {
  initStorage()
  await runMigrations()

  if (process.argv.includes("--migrate-only")) {
    console.log("Database migrations completed.")
    return
  }

  startWorker()
  serve({
    fetch: app.fetch,
    port: config.PORT,
  })
  console.log(`QingFrame server listening on http://localhost:${config.PORT}`)
}

void bootstrap()
