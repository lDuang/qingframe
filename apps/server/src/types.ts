export type ToolField = {
  key: string
  type: "text" | "textarea" | "select"
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

export type ToolConfig = {
  id: string
  name: string
  description: string
  mode: "generate" | "edit"
  enabled: boolean
  acceptsImages: boolean
  maxImages: number
  minImages?: number
  fields: ToolField[]
  defaults: {
    quality: string
    size: string
  }
  promptTemplate: string
}

export type StoredFile = {
  id: string
  deviceId: string
  originalName: string
  mimeType: string
  sizeBytes: number
  relativePath: string
  createdAt: number
  expiresAt: number
}

export type TaskStatus = "queued" | "processing" | "succeeded" | "failed" | "expired"

export type TaskRecord = {
  id: string
  deviceId: string
  toolId: string
  status: TaskStatus
  inputJson: string
  sourceFileIdsJson: string
  resultRelativePath: string | null
  resultMimeType: string | null
  provider: string
  providerModel: string
  providerRequestId: string | null
  providerRawJson: string | null
  errorMessage: string | null
  createdAt: number
  updatedAt: number
  expiresAt: number
}

export type RateLimitRecord = {
  key: string
  scope: string
  count: number
  windowStart: string
  cooldownUntil: number | null
  updatedAt: number
}
