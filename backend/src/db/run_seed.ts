import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "seed.sql"), "utf-8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const statements = sql
  .split("\n")
  .filter(l => !l.trim().startsWith("--") && l.trim())
  .join("\n")
  .split(";")
  .map(s => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await pool.query(stmt);
  console.log("OK:", stmt.slice(0, 60).replace(/\n/g, " ") + "...");
}

console.log("\nSeed concluído!");
await pool.end();
