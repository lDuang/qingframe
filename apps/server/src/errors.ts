export const PUBLIC_TASK_ERROR_MESSAGE = "处理失败，请稍后重试"

export class ProviderError extends Error {
  publicMessage: string
  internalMessage: string

  constructor(publicMessage: string, internalMessage: string) {
    super(internalMessage)
    this.name = "ProviderError"
    this.publicMessage = publicMessage
    this.internalMessage = internalMessage
  }
}

export const toInternalErrorMessage = (error: unknown) => {
  if (error instanceof ProviderError) return error.internalMessage
  if (error instanceof Error) return error.message
  return "Unknown error"
}
