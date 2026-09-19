import pool from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'migrate_staff_loan_v3.sql'), 'utf8');

const client = await pool.connect();
try {
  console.log('Applying migration v3...\n');
  await client.query(sql);
  console.log('✅  Migration v3 applied.\n');

  const { rows } = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'staff_loan_requests'
    ORDER BY ordinal_position
  `);
  console.log('All columns:\n');
  rows.forEach(r => console.log(`  ${r.column_name.padEnd(42)} ${r.data_type}`));
} catch (err) {
  console.error('❌  Migration failed:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
