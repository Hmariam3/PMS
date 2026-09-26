import pool from "../src/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, "migrate_staff_loan_v9.sql"), "utf8");
try {
  await pool.query(sql);
  console.log("✅  Migration v9 applied successfully.");
} catch (err) {
  console.error("❌  Migration v9 failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
