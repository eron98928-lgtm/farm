import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

console.log("Aplicando migrations...");
await migrate(db, { migrationsFolder: "./drizzle/migrations" });
console.log("Migrations aplicadas com sucesso!");

await pool.end();
