import pool from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'migrate_staff_loan_v5.sql'), 'utf8');

const client = await pool.connect();
try {
  console.log('Applying migration v5...\n');
  await client.query(sql);
  console.log('✅  Migration v5 applied.\n');
} catch (err) {
  console.error('❌  Migration failed:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
