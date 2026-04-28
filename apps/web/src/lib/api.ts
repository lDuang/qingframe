import { getDeviceId } from "@/lib/device"
import type { QuotaState, TaskResponse, TasksResponse, ToolsResponse, UploadResponse } from "@/lib/types"

export class ApiError extends Error {
  quota?: QuotaState

  constructor(message: string, quota?: QuotaState) {
    super(message)
    this.name = "ApiError"
    this.quota = quota
  }
}

const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers)
  headers.set("x-device-id", getDeviceId())
  const response = await fetch(url, { ...init, headers })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed: ${response.status}`, payload?.quota)
  }

  return payload as T
}

export const api = {
  getTools: () => request<ToolsResponse>("/api/tools"),
  getTasks: (limit = 12) => request<TasksResponse>(`/api/tasks?limit=${limit}`),
  createTask: (input: { toolId: string; inputs: Record<string, string>; fileIds: string[] }) =>
    request<TaskResponse>("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.set("file", file)
    return request<UploadResponse>("/api/files", {
      method: "POST",
      body: formData,
    })
  },
}
