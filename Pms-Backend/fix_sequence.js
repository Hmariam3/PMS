import pool from './src/db.js';

async function fixSequence() {
  try {
    const res = await pool.query("SELECT setval('branches_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.branches));");
    console.log('Sequence updated:', res.rows);
  } catch (err) {
    console.error('Error updating sequence:', err);
  } finally {
    pool.end();
  }
}

fixSequence();
