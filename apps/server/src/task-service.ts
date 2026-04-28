import { z } from "zod"
import { config } from "./config"
import { PUBLIC_TASK_ERROR_MESSAGE } from "./errors"
import { taskRepo } from "./repositories"
import { getFileById } from "./storage"
import { getTool } from "./tools"
import { createId, now } from "./utils"
import type { TaskRecord, ToolConfig } from "./types"

export const taskInputSchema = z.object({
  toolId: z.string().min(1),
  inputs: z.record(z.string(), z.string()).default({}),
  fileIds: z.array(z.string()).default([]),
})

export const publicToolShape = (tool: ToolConfig) => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  mode: tool.mode,
  acceptsImages: tool.acceptsImages,
  maxImages: tool.maxImages,
  minImages: tool.minImages ?? (tool.acceptsImages ? 1 : 0),
  fields: tool.fields,
  defaults: tool.defaults,
})

export const serializeTask = (task: TaskRecord) => ({
  id: task.id,
  toolId: task.toolId,
  status: task.status,
  inputs: JSON.parse(task.inputJson),
  sourceFileIds: JSON.parse(task.sourceFileIdsJson),
  errorMessage: task.status === "failed" ? PUBLIC_TASK_ERROR_MESSAGE : task.errorMessage,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  expiresAt: task.expiresAt,
  resultUrl: task.resultRelativePath ? `/api/tasks/${task.id}/result` : null,
})

export const validateTaskRequest = async (input: {
  deviceId: string
  toolId: string
  fileIds: string[]
}) => {
  const tool = getTool(input.toolId)
  if (!tool) {
    return { error: { code: "UNSUPPORTED_TOOL", message: "暂不支持该能力" }, status: 400 as const }
  }

  if (input.fileIds.length > tool.maxImages) {
    return {
      error: { code: "TOO_MANY_FILES", message: `最多上传 ${tool.maxImages} 张图片` },
      status: 400 as const,
    }
  }

  const minImages = tool.minImages ?? (tool.acceptsImages ? 1 : 0)
  if (input.fileIds.length < minImages) {
    return {
      error: { code: "MISSING_FILE", message: `当前模板至少需要 ${minImages} 张图片` },
      status: 400 as const,
    }
  }

  for (const fileId of input.fileIds) {
    const file = await getFileById(fileId)
    if (!file || file.deviceId !== input.deviceId) {
      return {
        error: { code: "INVALID_FILE", message: "上传图片无效，请重新上传" },
        status: 400 as const,
      }
    }
  }

  return { tool, status: 200 as const }
}

export const createQueuedTask = async (input: {
  deviceId: string
  toolId: string
  inputs: Record<string, string>
  fileIds: string[]
}) => {
  const timestamp = now()
  const task: TaskRecord = {
    id: createId("task"),
    deviceId: input.deviceId,
    toolId: input.toolId,
    status: "queued",
    inputJson: JSON.stringify(input.inputs),
    sourceFileIdsJson: JSON.stringify(input.fileIds),
    resultRelativePath: null,
    resultMimeType: null,
    provider: "packy",
    providerModel: config.API_MODEL,
    providerRequestId: null,
    providerRawJson: null,
    errorMessage: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    expiresAt: timestamp + config.TASK_TTL_HOURS * 60 * 60 * 1000,
  }

  await taskRepo.create(task)
  return task
}
