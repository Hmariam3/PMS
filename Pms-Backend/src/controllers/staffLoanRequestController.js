// Staff Loan Request Controller
import pool from "../db.js";
import path from "path";
import fs from "fs";
import { UPLOAD_DIR, deleteLoanDocument, loanDocumentExists, buildLoanDocFilename } from "../middleware/loanDocumentUpload.js";

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
      SELECT *
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

// Get staff loan requests by the requesting employee's email (created_by)
export const getStaffLoanRequestsByCreator = async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests
       WHERE LOWER(created_by) = LOWER($1)
       ORDER BY created_at DESC`,
      [email]
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching loan requests by creator:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
// Get staff loan requests by employee ID
export const getStaffLoanRequestsByEmployee = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests WHERE employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching loan requests by employee:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
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
    dob,
    branch_name,
    position_title,
    date_of_hire,
    length_of_service_years,
    phone_extension,
    date_of_request,
    loan_type,
    loan_amount_requested,
    loan_purpose,
    basic_salary,
    loan_application_count,
    retirement_date,
    attachment_file_name,
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

  const isEmergency = loan_type === "Emergency Loan";

  // For emergency loans scores are all 0
  const svc = isEmergency ? 0 : (service_tenure_score || 0);
  const ind = isEmergency ? 0 : (individual_performance_score || 0);
  const team = isEmergency ? 0 : (team_performance_score || 0);
  const disc = isEmergency ? 0 : (disciplinary_record_score || 0);
  const total = svc + ind + team + disc;

  try {
    const result = await pool.query(
      `INSERT INTO staff_loan_requests (
        employee_id, full_name, dob, branch_name, position_title,
        date_of_hire, length_of_service_years, phone_extension,
        date_of_request, loan_type, loan_amount_requested, loan_purpose,
        basic_salary, loan_application_count, retirement_date,
        attachment_file_name,
        service_tenure_band, service_tenure_score,
        individual_performance_band, individual_performance_score,
        team_performance_band, team_performance_score,
        disciplinary_record_band, disciplinary_record_score,
        total_score_claimed,
        staff_declaration_confirmed, staff_signature_date,
        status, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,$12,
        $13,$14,$15,
        $16,
        $17,$18,
        $19,$20,
        $21,$22,
        $23,$24,
        $25,
        $26,$27,
        $28,$29
      ) RETURNING *`,
      [
        employee_id, full_name, dob || null, branch_name, position_title,
        date_of_hire, length_of_service_years || null, phone_extension || null,
        date_of_request || new Date().toISOString().split('T')[0],
        loan_type, loan_amount_requested, loan_purpose || null,
        basic_salary || null, loan_application_count || null, retirement_date || null,
        attachment_file_name || null,
        isEmergency ? null : (service_tenure_band || null), svc,
        isEmergency ? null : (individual_performance_band || null), ind,
        isEmergency ? null : (team_performance_band || null), team,
        isEmergency ? null : (disciplinary_record_band || null), disc,
        total,
        staff_declaration_confirmed || false,
        staff_declaration_confirmed ? new Date().toISOString().split('T')[0] : null,
        'Pending',
        created_by || null
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
    basic_salary,
    loan_application_count,
    retirement_date,
    attachment_file_name,
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

  const isEmergency = loan_type === "Emergency Loan";

  const svc = isEmergency ? 0 : (service_tenure_score || 0);
  const ind = isEmergency ? 0 : (individual_performance_score || 0);
  const team = isEmergency ? 0 : (team_performance_score || 0);
  const disc = isEmergency ? 0 : (disciplinary_record_score || 0);
  const total_score_claimed = svc + ind + team + disc;

  try {
    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        loan_type                        = COALESCE($1,  loan_type),
        loan_amount_requested            = COALESCE($2,  loan_amount_requested),
        loan_purpose                     = COALESCE($3,  loan_purpose),
        basic_salary                     = COALESCE($4,  basic_salary),
        loan_application_count           = COALESCE($5,  loan_application_count),
        retirement_date                  = COALESCE($6,  retirement_date),
        attachment_file_name             = COALESCE($7,  attachment_file_name),
        service_tenure_band              = $8,
        service_tenure_score             = $9,
        individual_performance_band      = $10,
        individual_performance_score     = $11,
        team_performance_band            = $12,
        team_performance_score           = $13,
        disciplinary_record_band         = $14,
        disciplinary_record_score        = $15,
        total_score_claimed              = $16,
        staff_declaration_confirmed      = COALESCE($17, staff_declaration_confirmed),
        staff_signature_date             = CASE WHEN $17 = true THEN CURRENT_DATE ELSE staff_signature_date END,
        updated_by                       = $18
      WHERE id = $19
      RETURNING *`,
      [
        loan_type,
        loan_amount_requested,
        loan_purpose,
        basic_salary,
        loan_application_count,
        retirement_date || null,
        attachment_file_name || null,
        isEmergency ? null : (service_tenure_band || null),
        svc,
        isEmergency ? null : (individual_performance_band || null),
        ind,
        isEmergency ? null : (team_performance_band || null),
        team,
        isEmergency ? null : (disciplinary_record_band || null),
        disc,
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
        COUNT(CASE WHEN loan_type = 'Emergency Loan' THEN 1 END) as emergency_loan_count,
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

// Upload document for a loan request
export const uploadLoanDocument = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  try {
    // Fetch the actual employee name, ID and loan type from DB — reliable source
    const existing = await pool.query(
      "SELECT id, full_name, employee_id, loan_type, attachment_file_name FROM staff_loan_requests WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      deleteLoanDocument(req.file.filename);
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    const row = existing.rows[0];

    // Build the proper filename from DB values (not req.body which may be empty)
    const finalFilename = buildLoanDocFilename(
      row.loan_type,
      row.full_name,
      row.employee_id,
      req.file.originalname
    );

    // Rename the temp file to the structured name
    const tmpPath = path.join(UPLOAD_DIR, req.file.filename);
    const finalPath = path.join(UPLOAD_DIR, finalFilename);
    fs.renameSync(tmpPath, finalPath);

    // Delete previous attachment if one existed
    if (row.attachment_file_name && row.attachment_file_name !== finalFilename) {
      deleteLoanDocument(row.attachment_file_name);
    }

    // Persist the new filename in DB
    const result = await pool.query(
      `UPDATE staff_loan_requests
       SET attachment_file_name = $1,
           attachment_file_path = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, attachment_file_name, attachment_file_path`,
      [
        finalFilename,
        `uploads/staff-loan-documents/${finalFilename}`,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        id: result.rows[0].id,
        filename: result.rows[0].attachment_file_name,
        path: result.rows[0].attachment_file_path,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error("Error uploading loan document:", err.message);
    deleteLoanDocument(req.file.filename);
    res.status(500).json({ success: false, error: "Server error during upload" });
  }
};

// Download / view a loan document
export const downloadLoanDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT full_name, employee_id, loan_type, attachment_file_name FROM staff_loan_requests WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    const { attachment_file_name } = result.rows[0];

    if (!attachment_file_name) {
      return res.status(404).json({ success: false, error: "No document attached to this request" });
    }

    const filepath = path.join(UPLOAD_DIR, attachment_file_name);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: "File not found on server" });
    }

    // Detect content type from extension
    const ext = path.extname(attachment_file_name).toLowerCase();
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${attachment_file_name}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (err) {
    console.error("Error downloading loan document:", err.message);
    res.status(500).json({ success: false, error: "Server error during download" });
  }
};

// Delete a loan document
export const deleteLoanDocumentById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT attachment_file_name FROM staff_loan_requests WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    const { attachment_file_name } = result.rows[0];

    if (!attachment_file_name) {
      return res.status(404).json({ success: false, error: "No document attached" });
    }

    // Delete file from disk
    deleteLoanDocument(attachment_file_name);

    // Clear from DB
    await pool.query(
      `UPDATE staff_loan_requests
       SET attachment_file_name = NULL,
           attachment_file_path = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting loan document:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ── Employee Manager Review ────────────────────────────────────────────────────
export const managerReview = async (req, res) => {
  const { id } = req.params;
  const {
    reviewer_title,
    reviewer_email,

    // verified scores
    mgr_verified_service_score,
    mgr_verified_individual_score,
    mgr_verified_team_score,

    // fixed deductions
    deduction_income_tax,
    deduction_pension_7,

    // dynamic extra deductions  [{label, amount}]
    deduction_other_items,

    // repayment fields
    deduction_amount,    // the specific loan repayment deduction (e.g. ESL or HL repayment)
    deduction_months,    // repayment period

    // outstanding balances [{label, amount}]
    outstanding_balances,

    manager_remarks,
  } = req.body;

  // ── Role enforcement ──────────────────────────────────────────────────────
  if (!reviewer_title || reviewer_title.trim() !== "Manager, Payroll Administrator") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Only the Manager, Payroll Administrator can perform this review.",
    });
  }

  try {
    const existing = await pool.query(
      `SELECT id, basic_salary, manager_verified, loan_type,
              service_tenure_score, individual_performance_score,
              team_performance_score, disciplinary_record_score
       FROM staff_loan_requests WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }
    if (existing.rows[0].manager_verified) {
      return res.status(409).json({
        success: false,
        error: "This request has already been reviewed by the Manager, Payroll Administrator.",
      });
    }

    // Checker must go first
    const checkerCheck = await pool.query(
      `SELECT checker_verified FROM staff_loan_requests WHERE id = $1`, [id]
    );
    if (!checkerCheck.rows[0].checker_verified) {
      return res.status(409).json({
        success: false,
        error: "Manager, Employee Services Management must complete their review before the Manager can proceed.",
      });
    }

    const basicSalary = parseFloat(existing.rows[0].basic_salary) || 0;
    const isEmergency = existing.rows[0].loan_type === "Emergency Loan";

    // ── Use the system-calculated scores directly from DB (not editable by manager) ──
    const svcScore = existing.rows[0].service_tenure_score || 0;
    const indScore = existing.rows[0].individual_performance_score || 0;
    const teamScore = existing.rows[0].team_performance_score || 0;
    const discScore = existing.rows[0].disciplinary_record_score || 0;
    const totalScore = isEmergency ? 0 : (svcScore + indScore + teamScore + discScore);

    // ── Determine Recommended / Not Recommended based on loan type threshold ──
    const THRESHOLDS = {
      "Automobile": 100,
      "Housing/Mortgage": 85,
      "Personal Against Suretyship": 50,
      "Emergency Loan": 0,
    };
    const loanType = existing.rows[0].loan_type;
    const threshold = THRESHOLDS[loanType] ?? 100;
    const finalDecision = isEmergency || totalScore >= threshold
      ? "Recommended"
      : "Not Recommended";
    const finalStatus = finalDecision;

    // ── Deduction calculations ────────────────────────────────────────────────
    const incomeTax = parseFloat(deduction_income_tax) || 0;
    const pension7 = parseFloat(deduction_pension_7) || 0;
    const loanRepay = parseFloat(deduction_amount) || 0;

    const otherItems = Array.isArray(deduction_other_items) ? deduction_other_items : [];
    const otherTotal = otherItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const totalDeduction = incomeTax + pension7 + loanRepay + otherTotal;
    const netSalary = basicSalary - totalDeduction;

    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        manager_verified              = TRUE,
        manager_verified_by           = $1,
        manager_verified_at           = CURRENT_TIMESTAMP,
        mgr_verified_service_score    = $2,
        mgr_verified_individual_score = $3,
        mgr_verified_team_score       = $4,
        mgr_verified_total_score      = $5,
        deduction_income_tax          = $6,
        deduction_pension_7           = $7,
        deduction_other_items         = $8,
        deduction_amount              = $9,
        deduction_months              = $10,
        total_deduction               = $11,
        net_salary_after_deduction    = $12,
        outstanding_balances          = $13,
        manager_remarks               = $14,
        status                        = $15,
        decision                      = $16,
        updated_at                    = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *`,
      [
        reviewer_email,
        isEmergency ? null : svcScore,
        isEmergency ? null : indScore,
        isEmergency ? null : teamScore,
        isEmergency ? 0 : totalScore,
        incomeTax,
        pension7,
        JSON.stringify(otherItems),
        loanRepay,
        parseInt(deduction_months, 10) || 0,
        totalDeduction,
        netSalary,
        JSON.stringify(Array.isArray(outstanding_balances) ? outstanding_balances : []),
        manager_remarks || null,
        finalStatus,
        finalDecision,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Manager review submitted successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error in manager review:", err.message);
    res.status(500).json({ success: false, error: "Server error during manager review" });
  }
};

// ── Employee Checker Review ────────────────────────────────────────────────────
// Title required: 'Manager, Employee Services Management'
// Verifies disciplinary record AND loan application count.
export const checkerReview = async (req, res) => {
  const { id } = req.params;
  const {
    reviewer_title,
    reviewer_email,
    checker_disciplinary_verified,        // boolean
    checker_loan_application_verified,    // boolean
    checker_loan_application_remarks,     // text
    checker_remarks,
  } = req.body;

  // ── Role enforcement ──────────────────────────────────────────────────────
  if (!reviewer_title || reviewer_title.trim() !== "Manager, Employee Services Management") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Only the Manager, Employee Services Management can perform this review.",
    });
  }

  if (checker_disciplinary_verified === undefined || checker_disciplinary_verified === null) {
    return res.status(400).json({
      success: false,
      error: "Disciplinary verification decision is required.",
    });
  }

  if (checker_loan_application_verified === undefined || checker_loan_application_verified === null) {
    return res.status(400).json({
      success: false,
      error: "Loan application count verification decision is required.",
    });
  }

  try {
    const existing = await pool.query(
      `SELECT id, checker_verified FROM staff_loan_requests WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    if (existing.rows[0].checker_verified) {
      return res.status(409).json({
        success: false,
        error: "This request has already been reviewed by the Manager, Employee Services Management.",
      });
    }

    const disciplinaryClean = checker_disciplinary_verified === true || checker_disciplinary_verified === "true";
    const loanCountVerified = checker_loan_application_verified === true || checker_loan_application_verified === "true";

    // If either check fails → Not Recommended
    const finalStatus = (disciplinaryClean && loanCountVerified) ? "Checker Review" : "Not Recommended";

    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        checker_verified                     = TRUE,
        checker_verified_by                  = $1,
        checker_verified_at                  = CURRENT_TIMESTAMP,
        checker_disciplinary_verified        = $2,
        checker_loan_application_verified    = $3,
        checker_loan_application_remarks     = $4,
        checker_remarks                      = $5,
        status                               = $6,
        updated_at                           = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        reviewer_email,
        disciplinaryClean,
        loanCountVerified,
        checker_loan_application_remarks || null,
        checker_remarks || null,
        finalStatus,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Checker review submitted successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error in checker review:", err.message);
    res.status(500).json({ success: false, error: "Server error during checker review" });
  }
};

// ── Employee Approver — Final Approval ───────────────────────────────────────
// Title required: 'Employee Approver'
// Gives final green light to a Recommended request → status becomes 'Approved'.
export const approverApprove = async (req, res) => {
  const { id } = req.params;
  const { reviewer_title, reviewer_email, approver_remarks } = req.body;

  if (!reviewer_title || (reviewer_title !== "Employee Approver" || reviewer_title !== "Enterprise System Operation and Application Developer")) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Only the Employee Approver can perform this action.",
    });
  }

  try {
    const existing = await pool.query(
      `SELECT id, status FROM staff_loan_requests WHERE id = $1`, [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    if (existing.rows[0].status !== "Recommended") {
      return res.status(409).json({
        success: false,
        error: `Cannot approve a request with status "${existing.rows[0].status}". Only Recommended requests can be approved.`,
      });
    }

    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        status          = 'Approved',
        approved_by     = $1,
        approved_at     = CURRENT_TIMESTAMP,
        approver_remarks= $2,
        updated_at      = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *`,
      [reviewer_email, approver_remarks || null, id]
    );

    res.json({
      success: true,
      message: "Loan request approved successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error in approver action:", err.message);
    res.status(500).json({ success: false, error: "Server error during approval" });
  }
};

// Get all Recommended requests (for Approver page)
export const getRecommendedRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests WHERE status = 'Recommended' ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching recommended requests:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
