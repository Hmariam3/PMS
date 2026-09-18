// Staff Loan Request Controller
import pool from "../db.js";

// Helper function to calculate total score
const calculateTotalScore = (serviceScore, individualScore, teamScore, disciplinaryScore) => {
  return (
    (serviceScore || 0) +
    (individualScore || 0) +
    (teamScore || 0) +
    (disciplinaryScore || 0)
  );
};

// Helper function to calculate service tenure score
const calculateServiceTenureScore = (companyEntryDate) => {
  if (!companyEntryDate) return { band: 'Unknown', score: 0 };
  
  const hireDate = new Date(companyEntryDate);
  const today = new Date();
  const years = (today - hireDate) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (years >= 10) return { band: '10+ years', score: 20 };
  if (years >= 6) return { band: '6-10 years', score: 15 };
  if (years >= 3) return { band: '3-6 years', score: 10 };
  if (years >= 1) return { band: '1-3 years', score: 5 };
  return { band: '<1 year', score: 0 };
};

// Helper function to calculate individual performance score
const calculateIndividualPerformanceScore = (performanceResult) => {
  if (performanceResult === null || performanceResult === undefined) {
    return { band: 'Not rated', score: 0 };
  }
  
  const result = parseFloat(performanceResult);
  
  if (result > 120) return { band: '>120%', score: 50 };
  if (result >= 100) return { band: '100-119.99%', score: 40 };
  if (result >= 75) return { band: '75-99.99%', score: 30 };
  if (result >= 50) return { band: '50-74.99%', score: 20 };
  if (result >= 0) return { band: '0-50%', score: 10 };
  return { band: 'Not rated', score: 0 };
};

// Helper function to calculate team performance score
const calculateTeamPerformanceScore = (teamResult) => {
  if (teamResult === null || teamResult === undefined) {
    return { band: 'Not rated', score: 0 };
  }
  
  const result = parseFloat(teamResult);
  
  if (result > 120) return { band: '>120%', score: 20 };
  if (result >= 100) return { band: '100-119.99%', score: 16 };
  if (result >= 75) return { band: '75-99.99%', score: 12 };
  if (result >= 50) return { band: '50-74.99%', score: 8 };
  if (result >= 0) return { band: '0-50%', score: 4 };
  return { band: 'Not rated', score: 0 };
};

// Get auto-calculated loan scoring data for an employee
export const getEmployeeLoanScoringData = async (req, res) => {
  const { employeeId } = req.params;

  try {
    // 1. Get employee information
    const employeeResult = await pool.query(
      `SELECT 
        employee_id,
        display_name,
        dob,
        branch_name,
        title,
        company_entry_date,
        business_phone_number,
        outlook_address,
        business_email_address
      FROM public.employees 
      WHERE employee_id = $1`,
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Employee not found" 
      });
    }

    const employee = employeeResult.rows[0];

    // 2. Calculate length of service score
    const serviceTenure = calculateServiceTenureScore(employee.company_entry_date);
    
    // Calculate years of service
    let lengthOfServiceYears = 0;
    if (employee.company_entry_date) {
      const hireDate = new Date(employee.company_entry_date);
      const today = new Date();
      lengthOfServiceYears = parseFloat(
        ((today - hireDate) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(2)
      );
    }

    // 3. Get individual performance from previous_quarter_employee_evaluation_result
    const performanceResult = await pool.query(
      `SELECT 
        employee_id,
        performance_result,
        performance_status,
        created_date
      FROM public.previous_quarter_employee_evaluation_result 
      WHERE employee_id = $1
      ORDER BY created_date DESC
      LIMIT 1`,
      [employeeId]
    );

    let individualPerformance = { band: 'Not rated', score: 0 };
    let performanceData = null;
    
    if (performanceResult.rows.length > 0) {
      performanceData = performanceResult.rows[0];
      individualPerformance = calculateIndividualPerformanceScore(
        performanceData.performance_result
      );
    }

    // 4. Get team/branch performance from branch_vital
    // First get user's company_code from users table using employee's email
    const userResult = await pool.query(
      `SELECT company_code 
       FROM public.users 
       WHERE LOWER(mail_address) = LOWER($1)`,
      [employee.outlook_address || employee.business_email_address]
    );

    let teamPerformance = { band: 'Not rated', score: 0 };
    let branchVitalData = null;

    if (userResult.rows.length > 0 && userResult.rows[0].company_code) {
      const companyCode = userResult.rows[0].company_code;
      
      const branchVitalResult = await pool.query(
        `SELECT 
          "COMPANY_CODE",
          "BRANCH_NAME",
          "OUT_OF_100",
          "TOTAL_RESULT",
          "CREATED_AT"
        FROM public.branch_vital 
        WHERE "COMPANY_CODE" = $1
        ORDER BY "CREATED_AT" DESC
        LIMIT 1`,
        [companyCode]
      );

      if (branchVitalResult.rows.length > 0) {
        branchVitalData = branchVitalResult.rows[0];
        teamPerformance = calculateTeamPerformanceScore(
          branchVitalData.OUT_OF_100
        );
      }
    }

    // 5. Calculate total score (excluding disciplinary which user fills)
    const calculatedTotalScore = 
      serviceTenure.score + 
      individualPerformance.score + 
      teamPerformance.score;

    // 6. Prepare response
    const scoringData = {
      employee_info: {
        employee_id: employee.employee_id,
        full_name: employee.display_name,
        dob: employee.dob,
        branch_name: employee.branch_name,
        position_title: employee.title,
        date_of_hire: employee.company_entry_date,
        length_of_service_years: lengthOfServiceYears,
        phone_extension: employee.business_phone_number,
        email: employee.business_email_address || employee.outlook_address,
      },
      scoring: {
        service_tenure: {
          band: serviceTenure.band,
          score: serviceTenure.score,
          calculated_years: lengthOfServiceYears,
        },
        individual_performance: {
          band: individualPerformance.band,
          score: individualPerformance.score,
          raw_result: performanceData?.performance_result || null,
          status: performanceData?.performance_status || null,
        },
        team_performance: {
          band: teamPerformance.band,
          score: teamPerformance.score,
          raw_result: branchVitalData?.OUT_OF_100 || null,
          branch_name: branchVitalData?.BRANCH_NAME || null,
        },
        calculated_total: calculatedTotalScore,
      },
    };

    res.json({ 
      success: true,
      data: scoringData
    });

  } catch (err) {
    console.error("Error fetching employee loan scoring data:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error while fetching scoring data" 
    });
  }
};

// Get all staff loan requests
export const getAllStaffLoanRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        employee_id,
        full_name,
        branch_name,
        position_title,
        date_of_hire,
        length_of_service_years,
        phone_extension,
        date_of_request,
        loan_type,
        loan_amount_requested,
        loan_purpose,
        total_score_claimed,
        verified_total_score,
        status,
        decision,
        reviewed_by,
        review_date,
        created_at,
        updated_at
      FROM staff_loan_requests
      ORDER BY created_at DESC
    `);
    
    res.json({ 
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching staff loan requests:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error while fetching loan requests" 
    });
  }
};

// Get staff loan requests by employee ID
export const getStaffLoanRequestsByEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests 
       WHERE employee_id = $1 
       ORDER BY created_at DESC`,
      [employeeId]
    );

    res.json({ 
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching loan requests by employee:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Get staff loan requests by branch
export const getStaffLoanRequestsByBranch = async (req, res) => {
  const { branchName } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests 
       WHERE branch_name = $1 
       ORDER BY created_at DESC`,
      [branchName]
    );

    res.json({ 
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching loan requests by branch:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Get staff loan requests by status
export const getStaffLoanRequestsByStatus = async (req, res) => {
  const { status } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests 
       WHERE status = $1 
       ORDER BY created_at DESC`,
      [status]
    );

    res.json({ 
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching loan requests by status:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Get single staff loan request by ID
export const getStaffLoanRequestById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Loan request not found" 
      });
    }

    res.json({ 
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching loan request:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Create a new staff loan request
export const createStaffLoanRequest = async (req, res) => {
  const {
    employee_id,
    full_name,
    branch_name,
    position_title,
    date_of_hire,
    length_of_service_years,
    phone_extension,
    date_of_request,
    loan_type,
    loan_amount_requested,
    loan_purpose,
    service_tenure_band,
    service_tenure_score,
    individual_performance_band,
    individual_performance_score,
    team_performance_band,
    team_performance_score,
    disciplinary_record_band,
    disciplinary_record_score,
    staff_declaration_confirmed,
    created_by
  } = req.body;

  // Validate required fields
  if (!employee_id || !full_name || !branch_name || !position_title || 
      !date_of_hire || !loan_type || !loan_amount_requested) {
    return res.status(400).json({ 
      success: false,
      error: "Missing required fields" 
    });
  }

  // Calculate total score
  const total_score_claimed = calculateTotalScore(
    service_tenure_score,
    individual_performance_score,
    team_performance_score,
    disciplinary_record_score
  );

  try {
    const result = await pool.query(
      `INSERT INTO staff_loan_requests (
        employee_id,
        full_name,
        branch_name,
        position_title,
        date_of_hire,
        length_of_service_years,
        phone_extension,
        date_of_request,
        loan_type,
        loan_amount_requested,
        loan_purpose,
        service_tenure_band,
        service_tenure_score,
        individual_performance_band,
        individual_performance_score,
        team_performance_band,
        team_performance_score,
        disciplinary_record_band,
        disciplinary_record_score,
        total_score_claimed,
        staff_declaration_confirmed,
        staff_signature_date,
        status,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24
      ) RETURNING *`,
      [
        employee_id,
        full_name,
        branch_name,
        position_title,
        date_of_hire,
        length_of_service_years,
        phone_extension,
        date_of_request || new Date().toISOString().split('T')[0],
        loan_type,
        loan_amount_requested,
        loan_purpose,
        service_tenure_band,
        service_tenure_score || 0,
        individual_performance_band,
        individual_performance_score || 0,
        team_performance_band,
        team_performance_score || 0,
        disciplinary_record_band,
        disciplinary_record_score || 0,
        total_score_claimed,
        staff_declaration_confirmed || false,
        staff_declaration_confirmed ? new Date().toISOString().split('T')[0] : null,
        'Pending',
        created_by
      ]
    );

    res.status(201).json({ 
      success: true,
      message: "Staff loan request created successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating staff loan request:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error while creating loan request" 
    });
  }
};

// Update staff loan request (for staff to edit their submission)
export const updateStaffLoanRequest = async (req, res) => {
  const { id } = req.params;
  const {
    loan_type,
    loan_amount_requested,
    loan_purpose,
    service_tenure_band,
    service_tenure_score,
    individual_performance_band,
    individual_performance_score,
    team_performance_band,
    team_performance_score,
    disciplinary_record_band,
    disciplinary_record_score,
    staff_declaration_confirmed,
    updated_by
  } = req.body;

  // Calculate total score
  const total_score_claimed = calculateTotalScore(
    service_tenure_score,
    individual_performance_score,
    team_performance_score,
    disciplinary_record_score
  );

  try {
    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        loan_type = COALESCE($1, loan_type),
        loan_amount_requested = COALESCE($2, loan_amount_requested),
        loan_purpose = COALESCE($3, loan_purpose),
        service_tenure_band = COALESCE($4, service_tenure_band),
        service_tenure_score = COALESCE($5, service_tenure_score),
        individual_performance_band = COALESCE($6, individual_performance_band),
        individual_performance_score = COALESCE($7, individual_performance_score),
        team_performance_band = COALESCE($8, team_performance_band),
        team_performance_score = COALESCE($9, team_performance_score),
        disciplinary_record_band = COALESCE($10, disciplinary_record_band),
        disciplinary_record_score = COALESCE($11, disciplinary_record_score),
        total_score_claimed = $12,
        staff_declaration_confirmed = COALESCE($13, staff_declaration_confirmed),
        staff_signature_date = CASE WHEN $13 = true THEN CURRENT_DATE ELSE staff_signature_date END,
        updated_by = $14
      WHERE id = $15
      RETURNING *`,
      [
        loan_type,
        loan_amount_requested,
        loan_purpose,
        service_tenure_band,
        service_tenure_score,
        individual_performance_band,
        individual_performance_score,
        team_performance_band,
        team_performance_score,
        disciplinary_record_band,
        disciplinary_record_score,
        total_score_claimed,
        staff_declaration_confirmed,
        updated_by,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Loan request not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Staff loan request updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating staff loan request:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error while updating loan request" 
    });
  }
};

// Update verification and review (for Branch Manager/HR)
export const verifyAndReviewLoanRequest = async (req, res) => {
  const { id } = req.params;
  const {
    verified_service_score,
    verified_individual_performance_score,
    verified_team_performance_score,
    verified_disciplinary_score,
    decision,
    reviewer_comments,
    reviewed_by,
    updated_by
  } = req.body;

  // Calculate verified total score
  const verified_total_score = calculateTotalScore(
    verified_service_score,
    verified_individual_performance_score,
    verified_team_performance_score,
    verified_disciplinary_score
  );

  // Determine status based on decision
  let status = 'Under Review';
  if (decision === 'Recommended') {
    status = 'Recommended';
  } else if (decision === 'Not Recommended') {
    status = 'Not Recommended';
  }

  try {
    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        verified_service_score = COALESCE($1, verified_service_score),
        verified_individual_performance_score = COALESCE($2, verified_individual_performance_score),
        verified_team_performance_score = COALESCE($3, verified_team_performance_score),
        verified_disciplinary_score = COALESCE($4, verified_disciplinary_score),
        verified_total_score = $5,
        decision = COALESCE($6, decision),
        reviewer_comments = COALESCE($7, reviewer_comments),
        reviewed_by = COALESCE($8, reviewed_by),
        review_date = CURRENT_DATE,
        status = $9,
        updated_by = $10
      WHERE id = $11
      RETURNING *`,
      [
        verified_service_score,
        verified_individual_performance_score,
        verified_team_performance_score,
        verified_disciplinary_score,
        verified_total_score,
        decision,
        reviewer_comments,
        reviewed_by,
        status,
        updated_by,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Loan request not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Loan request reviewed successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error reviewing loan request:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error while reviewing loan request" 
    });
  }
};

// Update loan request status
export const updateLoanRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status, updated_by } = req.body;

  const validStatuses = ['Pending', 'Under Review', 'Recommended', 'Not Recommended', 'Approved', 'Rejected'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false,
      error: "Invalid status value" 
    });
  }

  try {
    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        status = $1,
        updated_by = $2
      WHERE id = $3
      RETURNING *`,
      [status, updated_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Loan request not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Loan request status updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating loan request status:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Delete staff loan request
export const deleteStaffLoanRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM staff_loan_requests WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Loan request not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Loan request deleted successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting loan request:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Get loan request statistics/summary
export const getLoanRequestStatistics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review_count,
        COUNT(CASE WHEN status = 'Recommended' THEN 1 END) as recommended_count,
        COUNT(CASE WHEN status = 'Not Recommended' THEN 1 END) as not_recommended_count,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN loan_type = 'Personal Against Suretyship' THEN 1 END) as personal_loan_count,
        COUNT(CASE WHEN loan_type = 'Housing/Mortgage' THEN 1 END) as housing_loan_count,
        COUNT(CASE WHEN loan_type = 'Automobile' THEN 1 END) as automobile_loan_count,
        ROUND(AVG(total_score_claimed), 2) as avg_claimed_score,
        ROUND(AVG(verified_total_score), 2) as avg_verified_score,
        SUM(loan_amount_requested) as total_amount_requested
      FROM staff_loan_requests
    `);

    res.json({ 
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching loan request statistics:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};
