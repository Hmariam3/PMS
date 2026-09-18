import pool from './src/db.js';

async function checkTables() {
  try {
    console.log('Checking users table structure...\n');
    const usersResult = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name='users' 
       ORDER BY ordinal_position`
    );
    
    console.log('Users table columns:');
    usersResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n\nChecking previous_quarter_employee_evaluation_result table...\n');
    const perfResult = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name='previous_quarter_employee_evaluation_result' 
       ORDER BY ordinal_position`
    );
    
    console.log('Performance evaluation table columns:');
    perfResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
