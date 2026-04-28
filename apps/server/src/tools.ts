import fs from "node:fs"
import { config } from "./config"
import type { ToolConfig } from "./types"

let cache: ToolConfig[] | null = null
let cacheMtime = 0

export const loadTools = (): ToolConfig[] => {
  const stat = fs.statSync(config.toolsConfigPath)
  if (!cache || stat.mtimeMs !== cacheMtime) {
    cache = JSON.parse(fs.readFileSync(config.toolsConfigPath, "utf8")) as ToolConfig[]
    cacheMtime = stat.mtimeMs
  }
  return cache.filter((tool) => tool.enabled)
}

export const getTool = (toolId: string) => loadTools().find((tool) => tool.id === toolId) ?? null