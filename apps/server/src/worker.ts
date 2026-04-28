import { config } from "./config"
import { PUBLIC_TASK_ERROR_MESSAGE, toInternalErrorMessage } from "./errors"
import { fileRepo, taskRepo } from "./repositories"
import { runPackyTask } from "./provider"
import { deleteIfExists } from "./storage"
import { now } from "./utils"

let processing = false

const processOneTask = async () => {
  const task = await taskRepo.findNextQueued(now())
  if (!task) return

  await taskRepo.updateProgress({
    id: task.id,
    status: "processing",
    resultRelativePath: task.resultRelativePath,
    resultMimeType: task.resultMimeType,
    providerRequestId: task.providerRequestId,
    providerRawJson: task.providerRawJson,
    updatedAt: now(),
  })

  try {
    const outcome = await runPackyTask({
      taskId: task.id,
      toolId: task.toolId,
      inputs: JSON.parse(task.inputJson),
      sourceFileIds: JSON.parse(task.sourceFileIdsJson),
    })

    await taskRepo.updateProgress({
      id: task.id,
      status: "succeeded",
      resultRelativePath: outcome.resultRelativePath,
      resultMimeType: outcome.resultMimeType,
      providerRequestId: outcome.providerRequestId ?? null,
      providerRawJson: outcome.providerRawJson,
      updatedAt: now(),
    })
  } catch (error) {
    console.error(`[task:${task.id}]`, toInternalErrorMessage(error))
    await taskRepo.updateProgress({
      id: task.id,
      status: "failed",
      errorMessage: PUBLIC_TASK_ERROR_MESSAGE,
      updatedAt: now(),
    })
  }
}

const cleanupExpired = async () => {
  const timestamp = now()
  await taskRepo.expire(timestamp)

  for (const task of await taskRepo.listExpiredWithResults(timestamp)) {
    deleteIfExists(task.resultRelativePath)
  }

  for (const file of await fileRepo.listExpired(timestamp)) {
    deleteIfExists(file.relativePath)
  }

  await fileRepo.deleteExpired(timestamp)
  await taskRepo.deleteExpired(timestamp)
}

export const startWorker = () => {
  setInterval(async () => {
    if (processing) return
    processing = true
    try {
      await processOneTask()
    } finally {
      processing = false
    }
  }, config.WORKER_POLL_MS)

  setInterval(() => {
    void cleanupExpired()
  }, config.CLEANUP_POLL_MS)
}
