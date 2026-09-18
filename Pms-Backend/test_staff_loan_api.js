// Test script for Staff Loan Request API endpoints
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/staff-loan-requests';

// Test data
const testLoanRequest = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  branch_name: 'Main Branch',
  position_title: 'Senior Officer',
  date_of_hire: '2018-01-15',
  length_of_service_years: 6.5,
  phone_extension: '1234',
  date_of_request: '2026-09-18',
  loan_type: 'Personal Against Suretyship',
  loan_amount_requested: 50000,
  loan_purpose: 'Home improvement',
  service_tenure_band: '6-10 years',
  service_tenure_score: 15,
  individual_performance_band: '100-119.99%',
  individual_performance_score: 40,
  team_performance_band: '>120%',
  team_performance_score: 20,
  disciplinary_record_band: 'Clean record',
  disciplinary_record_score: 10,
  staff_declaration_confirmed: true,
  created_by: 'test@example.com'
};

async function testAPI() {
  console.log('🧪 Testing Staff Loan Request API Endpoints...\n');

  try {
    // Test 1: Get all loan requests (should be empty initially)
    console.log('1️⃣  Testing GET all loan requests...');
    const getAllResponse = await axios.get(API_URL);
    console.log('✅ GET all requests successful');
    console.log(`   Found ${getAllResponse.data.count} requests\n`);

    // Test 2: Create a new loan request
    console.log('2️⃣  Testing POST create loan request...');
    const createResponse = await axios.post(API_URL, testLoanRequest);
    console.log('✅ POST create successful');
    const createdId = createResponse.data.data.id;
    console.log(`   Created request ID: ${createdId}`);
    console.log(`   Total Score: ${createResponse.data.data.total_score_claimed}\n`);

    // Test 3: Get loan request by ID
    console.log('3️⃣  Testing GET loan request by ID...');
    const getByIdResponse = await axios.get(`${API_URL}/${createdId}`);
    console.log('✅ GET by ID successful');
    console.log(`   Retrieved: ${getByIdResponse.data.data.full_name}\n`);

    // Test 4: Update loan request
    console.log('4️⃣  Testing PUT update loan request...');
    const updateData = {
      loan_amount_requested: 75000,
      loan_purpose: 'Updated purpose: Home improvement and renovation',
      updated_by: 'test@example.com'
    };
    const updateResponse = await axios.put(`${API_URL}/${createdId}`, updateData);
    console.log('✅ PUT update successful');
    console.log(`   New amount: ${updateResponse.data.data.loan_amount_requested}\n`);

    // Test 5: Review and verify loan request
    console.log('5️⃣  Testing PUT review/verify loan request...');
    const reviewData = {
      verified_service_score: 15,
      verified_individual_performance_score: 40,
      verified_team_performance_score: 20,
      verified_disciplinary_score: 10,
      decision: 'Recommended',
      reviewer_comments: 'Excellent performance record. Loan recommended for approval.',
      reviewed_by: 'manager@example.com',
      updated_by: 'manager@example.com'
    };
    const reviewResponse = await axios.put(`${API_URL}/${createdId}/review`, reviewData);
    console.log('✅ PUT review successful');
    console.log(`   Decision: ${reviewResponse.data.data.decision}`);
    console.log(`   Verified Total Score: ${reviewResponse.data.data.verified_total_score}\n`);

    // Test 6: Get statistics
    console.log('6️⃣  Testing GET statistics...');
    const statsResponse = await axios.get(`${API_URL}/statistics`);
    console.log('✅ GET statistics successful');
    console.log(`   Total requests: ${statsResponse.data.data.total_requests}`);
    console.log(`   Recommended: ${statsResponse.data.data.recommended_count}`);
    console.log(`   Average claimed score: ${statsResponse.data.data.avg_claimed_score}`);
    console.log(`   Average verified score: ${statsResponse.data.data.avg_verified_score}\n`);

    // Test 7: Get by employee ID
    console.log('7️⃣  Testing GET by employee ID...');
    const byEmployeeResponse = await axios.get(`${API_URL}/employee/EMP001`);
    console.log('✅ GET by employee ID successful');
    console.log(`   Found ${byEmployeeResponse.data.count} requests for EMP001\n`);

    // Test 8: Get by status
    console.log('8️⃣  Testing GET by status...');
    const byStatusResponse = await axios.get(`${API_URL}/status/Recommended`);
    console.log('✅ GET by status successful');
    console.log(`   Found ${byStatusResponse.data.count} recommended requests\n`);

    // Test 9: Update status
    console.log('9️⃣  Testing PATCH update status...');
    const statusUpdate = {
      status: 'Approved',
      updated_by: 'hr@example.com'
    };
    const statusResponse = await axios.patch(`${API_URL}/${createdId}/status`, statusUpdate);
    console.log('✅ PATCH status update successful');
    console.log(`   New status: ${statusResponse.data.data.status}\n`);

    // Test 10: Delete loan request
    console.log('🔟 Testing DELETE loan request...');
    const deleteResponse = await axios.delete(`${API_URL}/${createdId}`);
    console.log('✅ DELETE successful');
    console.log(`   Deleted request ID: ${deleteResponse.data.data.id}\n`);

    // Final verification
    console.log('✔️  Testing GET all after deletion...');
    const finalGetResponse = await axios.get(API_URL);
    console.log(`   Final count: ${finalGetResponse.data.count} requests\n`);

    console.log('🎉 All API tests passed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.error || error.response.data}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests
testAPI();
