// Test script for Employee Loan Scoring Auto-Calculation
import axios from 'axios';
import pool from './src/db.js';

const API_URL = 'http://localhost:4000/api';

async function setupTestData() {
  console.log('📊 Setting up test data...\n');
  
  try {
    // Create test employee
    const testEmployee = {
      employee_id: '12345',
      display_name: 'Test Employee',
      dob: '1990-05-15',
      branch_name: 'Main Branch',
      title: 'Senior Officer',
      company_entry_date: '2018-01-01', // ~6.7 years of service
      business_phone_number: '0911123456',
      outlook_address: 'test.employee@example.com',
      business_email_address: 'test.employee@example.com',
      gender: 'M',
      supervisor: 'Manager Name',
      process_name: 'Banking',
      sub_process_name: 'Retail Banking',
      job_level: 'Senior',
      pay_grade: 'G5',
      organization_unit: 'Branch'
    };

    // Check if employee exists
    const existingEmp = await pool.query(
      'SELECT * FROM employees WHERE employee_id = $1',
      [testEmployee.employee_id]
    );

    if (existingEmp.rows.length === 0) {
      await pool.query(
        `INSERT INTO employees 
        (employee_id, display_name, dob, branch_name, title, company_entry_date, 
         business_phone_number, outlook_address, business_email_address, gender, 
         supervisor, process_name, sub_process_name, job_level, pay_grade, organization_unit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          testEmployee.employee_id, testEmployee.display_name, testEmployee.dob,
          testEmployee.branch_name, testEmployee.title, testEmployee.company_entry_date,
          testEmployee.business_phone_number, testEmployee.outlook_address,
          testEmployee.business_email_address, testEmployee.gender, testEmployee.supervisor,
          testEmployee.process_name, testEmployee.sub_process_name, testEmployee.job_level,
          testEmployee.pay_grade, testEmployee.organization_unit
        ]
      );
      console.log('✅ Test employee created');
    } else {
      console.log('ℹ️  Test employee already exists');
    }

    // Create test user with company_code
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE LOWER(mail_address) = LOWER($1)',
      [testEmployee.outlook_address]
    );

    if (existingUser.rows.length === 0) {
      await pool.query(
        `INSERT INTO users 
        (user_name, mail_address, full_name, company_code, role, position, title, organization)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['testuser', testEmployee.outlook_address, testEmployee.display_name, '001', 'Employee', 'Individual', testEmployee.title, 'Branch']
      );
      console.log('✅ Test user created with company_code: 001');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // Create test performance evaluation
    const existingPerf = await pool.query(
      'SELECT * FROM previous_quarter_employee_evaluation_result WHERE employee_id = $1',
      [testEmployee.employee_id]
    );

    if (existingPerf.rows.length === 0) {
      await pool.query(
        `INSERT INTO previous_quarter_employee_evaluation_result 
        (employee_id, username, fullname, mail, process, subprocess, branch, title, 
         position, performance_result, performance_status, created_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          testEmployee.employee_id, 'testuser', testEmployee.display_name,
          testEmployee.outlook_address, testEmployee.process_name,
          testEmployee.sub_process_name, testEmployee.branch_name,
          testEmployee.title, 'Individual', 110.5, 'Very Good', new Date()
        ]
      );
      console.log('✅ Test performance evaluation created (110.5%)');
    } else {
      console.log('ℹ️  Test performance evaluation already exists');
    }

    // Create test branch vital
    const existingVital = await pool.query(
      'SELECT * FROM branch_vital WHERE "COMPANY_CODE" = $1',
      ['001']
    );

    if (existingVital.rows.length === 0) {
      await pool.query(
        `INSERT INTO branch_vital 
        ("COMPANY_CODE", "BRANCH_NAME", "LOCAL_DEPOSIT", "FCY", 
         "MERCHANT_TRANSACTION_VOLUME", "AGENT_TRANSACTION_VOLUME", 
         "TOTAL_RESULT", "OUT_OF_100", "CREATED_AT")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['001', 'Main Branch', 1000000, 50000, 100, 200, 95, 95.5, new Date()]
      );
      console.log('✅ Test branch vital created (95.5%)');
    } else {
      console.log('ℹ️  Test branch vital already exists');
    }

    console.log('\n');
    return testEmployee.employee_id;
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    throw error;
  }
}

async function testEmployeeScoring(employeeId) {
  console.log('🧪 Testing Employee Loan Scoring Endpoint...\n');

  try {
    const response = await axios.get(
      `${API_URL}/staff-loan-requests/employee-scoring/${employeeId}`
    );

    if (response.data.success) {
      const data = response.data.data;

      console.log('✅ API Response Successful\n');

      // Employee Info
      console.log('👤 EMPLOYEE INFORMATION:');
      console.log('─'.repeat(50));
      console.log(`   Employee ID: ${data.employee_info.employee_id}`);
      console.log(`   Full Name: ${data.employee_info.full_name}`);
      console.log(`   DOB: ${data.employee_info.dob}`);
      console.log(`   Branch: ${data.employee_info.branch_name}`);
      console.log(`   Position: ${data.employee_info.position_title}`);
      console.log(`   Date of Hire: ${data.employee_info.date_of_hire}`);
      console.log(`   Years of Service: ${data.employee_info.length_of_service_years}`);
      console.log(`   Phone: ${data.employee_info.phone_extension}`);
      console.log();

      // Scoring Results
      console.log('📊 AUTO-CALCULATED SCORING:');
      console.log('─'.repeat(50));
      
      console.log('\n1️⃣  Service Tenure:');
      console.log(`   Band: ${data.scoring.service_tenure.band}`);
      console.log(`   Score: ${data.scoring.service_tenure.score}/20 points`);
      console.log(`   Calculated Years: ${data.scoring.service_tenure.calculated_years}`);
      
      console.log('\n2️⃣  Individual Performance:');
      console.log(`   Band: ${data.scoring.individual_performance.band}`);
      console.log(`   Score: ${data.scoring.individual_performance.score}/50 points`);
      console.log(`   Raw Result: ${data.scoring.individual_performance.raw_result}%`);
      console.log(`   Status: ${data.scoring.individual_performance.status}`);
      
      console.log('\n3️⃣  Team Performance:');
      console.log(`   Band: ${data.scoring.team_performance.band}`);
      console.log(`   Score: ${data.scoring.team_performance.score}/20 points`);
      console.log(`   Raw Result: ${data.scoring.team_performance.raw_result}%`);
      console.log(`   Branch: ${data.scoring.team_performance.branch_name}`);
      
      console.log('\n📈 TOTAL CALCULATED SCORE (excluding disciplinary):');
      console.log(`   ${data.scoring.calculated_total}/90 points`);
      console.log();

      // Verify calculations
      console.log('✔️  VERIFICATION:');
      console.log('─'.repeat(50));
      
      const expectedTotal = 
        data.scoring.service_tenure.score +
        data.scoring.individual_performance.score +
        data.scoring.team_performance.score;
      
      if (expectedTotal === data.scoring.calculated_total) {
        console.log('   ✅ Total score calculation is correct');
      } else {
        console.log(`   ❌ Total score mismatch: Expected ${expectedTotal}, Got ${data.scoring.calculated_total}`);
      }
      
      // Check service tenure calculation
      const yearsOfService = data.scoring.service_tenure.calculated_years;
      let expectedServiceScore = 0;
      if (yearsOfService >= 10) expectedServiceScore = 20;
      else if (yearsOfService >= 6) expectedServiceScore = 15;
      else if (yearsOfService >= 3) expectedServiceScore = 10;
      else if (yearsOfService >= 1) expectedServiceScore = 5;
      
      if (expectedServiceScore === data.scoring.service_tenure.score) {
        console.log('   ✅ Service tenure score is correct for years of service');
      } else {
        console.log(`   ❌ Service tenure score mismatch: Expected ${expectedServiceScore}, Got ${data.scoring.service_tenure.score}`);
      }

      console.log('\n🎉 All tests passed successfully!\n');

    } else {
      console.error('❌ API returned unsuccessful response');
    }

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

async function cleanup(employeeId) {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    await pool.query('DELETE FROM branch_vital WHERE "COMPANY_CODE" = $1', ['001']);
    await pool.query('DELETE FROM previous_quarter_employee_evaluation_result WHERE employee_id = $1', [employeeId]);
    await pool.query('DELETE FROM users WHERE mail_address = $1', ['test.employee@example.com']);
    await pool.query('DELETE FROM employees WHERE employee_id = $1', [employeeId]);
    
    console.log('✅ Test data cleaned up\n');
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
}

async function runTests() {
  let employeeId;
  
  try {
    // Setup test data
    employeeId = await setupTestData();
    
    // Test the scoring endpoint
    await testEmployeeScoring(employeeId);
    
    // Optional: Uncomment to cleanup test data
    // await cleanup(employeeId);
    
    console.log('✨ Test suite completed successfully!\n');
    console.log('Note: Test data has been preserved for manual testing.');
    console.log('To clean up, uncomment the cleanup call in the script.\n');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
runTests();
