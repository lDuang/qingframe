import fs from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { config } from "./config"
import * as schema from "./schema"

fs.mkdirSync(config.dataDir, { recursive: true })

const client = postgres(config.databaseUrl, {
  max: 1,
  prepare: false,
})

export const db = drizzle(client, { schema })

export const runMigrations = async () => {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") })
}
