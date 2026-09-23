// Apply staff_loan_requests v7 migration — drop unused legacy columns
import pool from "../src/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  const sql = fs.readFileSync(
    path.join(__dirname, "migrate_staff_loan_v7.sql"),
    "utf8"
  );
  try {
    await pool.query(sql);
    console.log("✅  Migration v7 applied successfully.");
  } catch (err) {
    console.error("❌  Migration v7 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
