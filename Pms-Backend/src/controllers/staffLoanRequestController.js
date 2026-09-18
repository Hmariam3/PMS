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
