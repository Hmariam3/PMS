// Migration script to create staff_loan_requests table
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function applySchema() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration for staff_loan_requests table...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'staff_loan_request_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await client.query(schemaSql);
    
    console.log('✓ Successfully created staff_loan_requests table and related objects');
    console.log('✓ Indexes created');
    console.log('✓ Triggers created');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error applying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
applySchema()
  .then(() => {
    console.log('Database migration process finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database migration failed:', err);
    process.exit(1);
  });
