import pool from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'migrate_staff_loan_v2.sql'), 'utf8');

const client = await pool.connect();
try {
  console.log('Applying migration v2 to staff_loan_requests...\n');
  await client.query(sql);
  console.log('✅  Migration applied successfully.\n');

  // Verify
  const { rows } = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'staff_loan_requests'
    ORDER BY ordinal_position
  `);
  console.log('Current columns:\n');
  rows.forEach(r => console.log(`  ${r.column_name.padEnd(40)} ${r.data_type}`));
} catch (err) {
  console.error('❌  Migration failed:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
