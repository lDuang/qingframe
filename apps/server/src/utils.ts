import { randomUUID } from "node:crypto"

export const now = () => Date.now()

export const createId = (prefix: string) => `${prefix}_${randomUUID().replaceAll("-", "")}`

export const ensureTrailingSentence = (value: string) => value.trim().replace(/\s+/g, " ")

export const formatPrompt = (template: string, notes?: string) => {
  const suffix = notes ? ensureTrailingSentence(notes) : ""
  return template.replace("{{notes}}", suffix)
}