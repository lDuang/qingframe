import fs from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { config } from "./config"
import * as schema from "./schema"

fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true })

const client = new Database(config.sqlitePath)

export const db = drizzle(client, { schema })

export const runMigrations = async () => {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") })
}
