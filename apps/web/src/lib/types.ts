export type ToolField = {
  key: string
  type: "text" | "textarea" | "select"
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

export type Tool = {
  id: string
  name: string
  description: string
  mode: "generate" | "edit"
  acceptsImages: boolean
  maxImages: number
  minImages?: number
  fields: ToolField[]
  defaults: {
    quality: string
    size: string
  }
}

export type Task = {
  id: string
  toolId: string
  status: "queued" | "processing" | "succeeded" | "failed" | "expired"
  inputs: Record<string, string>
  sourceFileIds: string[]
  errorMessage: string | null
  createdAt: number
  updatedAt: number
  expiresAt: number
  resultUrl: string | null
}

export type QuotaState = {
  dailyLimit: number
  remainingToday: number
  retryAfterSeconds: number
}

export type UploadedFile = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  expiresAt: number
}

export type ToolsResponse = {
  tools: Tool[]
  quota: QuotaState
}

export type TasksResponse = {
  tasks: Task[]
}

export type TaskResponse = {
  task: Task
  quota: QuotaState
}

export type UploadResponse = {
  file: UploadedFile
}
