import { config } from "./config"
import { readFile } from "node:fs/promises"
import { formatPrompt } from "./utils"
import { getTool } from "./tools"
import { getFileById, resolveDataPath, saveResultFromUrl } from "./storage"
import { ProviderError } from "./errors"

export type ProviderExecutionInput = {
  taskId: string
  toolId: string
  inputs: Record<string, string>
  sourceFileIds: string[]
}

const authHeaders = {
  Authorization: `Bearer ${config.BASE_API_KEY}`,
}

const parseJson = async (response: Response) => {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

const requireResultUrl = (payload: any) => {
  const item = payload?.data?.[0]
  if (item?.url) return item.url as string
  if (item?.b64_json) {
    throw new ProviderError("图片处理失败，请稍后重试", "Upstream returned base64 image data; current implementation expects URL output.")
  }
  throw new ProviderError("图片处理失败，请稍后重试", "Upstream response did not include an image URL.")
}

const createEditBody = async (prompt: string, size: string, quality: string, sourceFileIds: string[]) => {
  const form = new FormData()
  form.set("model", config.API_MODEL)
  form.set("prompt", prompt)
  form.set("size", size)
  form.set("quality", quality)

  for (const fileId of sourceFileIds) {
    const stored = await getFileById(fileId)
    if (!stored) {
      throw new ProviderError("上传图片无效，请重新上传", `Missing source file: ${fileId}`)
    }
    const absolutePath = resolveDataPath(stored.relativePath)
    const bytes = await readFile(absolutePath)
    const file = new File([bytes], stored.originalName, { type: stored.mimeType })
    form.append("image", file)
  }

  return form
}

export const runPackyTask = async (input: ProviderExecutionInput) => {
  const tool = getTool(input.toolId)
  if (!tool) {
    throw new ProviderError("处理失败，请稍后重试", `Unsupported tool: ${input.toolId}`)
  }

  const prompt = formatPrompt(tool.promptTemplate, input.inputs.notes)
  const size = input.inputs.size || tool.defaults.size
  const quality = input.inputs.quality || tool.defaults.quality
  const useEditMode = input.sourceFileIds.length > 0

  let response: Response
  try {
    if (useEditMode) {
      const body = await createEditBody(prompt, size, quality, input.sourceFileIds)
      response = await fetch(`${config.API_BASE_URL}/images/edits`, {
        method: "POST",
        headers: authHeaders,
        body,
        signal: AbortSignal.timeout(config.API_TIMEOUT_MS),
      })
    } else {
      response = await fetch(`${config.API_BASE_URL}/images/generations`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.API_MODEL,
          prompt,
          size,
          quality,
        }),
        signal: AbortSignal.timeout(config.API_TIMEOUT_MS),
      })
    }
  } catch (error) {
    throw new ProviderError("服务暂时不可用，请稍后重试", error instanceof Error ? error.message : "Upstream request failed")
  }

  const payload = await parseJson(response)
  if (!response.ok) {
    const internalMessage = payload?.error?.message || payload?.message || `Upstream request failed with status ${response.status}`
    throw new ProviderError("图片处理失败，请稍后重试", internalMessage)
  }

  const resultUrl = requireResultUrl(payload)
  const stored = await saveResultFromUrl(input.taskId, resultUrl)

  return {
    providerRequestId: response.headers.get("x-request-id") || response.headers.get("request-id"),
    providerRawJson: JSON.stringify(payload),
    resultRelativePath: stored.relativePath,
    resultMimeType: stored.mimeType,
  }
}
