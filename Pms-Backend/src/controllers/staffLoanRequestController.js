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

  if (result > 120) return { band: '>120%', score: 70 };
  if (result >= 100) return { band: '100-119.99%', score: 56 };
  if (result >= 75) return { band: '75-99.99%', score: 42 };
  if (result >= 50) return { band: '50-74.99%', score: 28 };
  if (result >= 0) return { band: '0-50%', score: 14 };
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

// Helper function to calculate required threshold
const getRequiredThreshold = (loanType, orgUnit, positionTitle) => {
  const orgLower = (orgUnit || "").toLowerCase();
  const isBranch = orgLower === "branch" || orgLower.includes("branch");
  const isHO = orgLower === "ho" || orgLower.includes("head");
  const isDO = orgLower === "do" || orgLower.includes("district");
  
  const titleLower = (positionTitle || "").toLowerCase();
  const isCashierOrController = titleLower.includes("cashier") || titleLower.includes("internal controller");
  
  let thresholds = {
    "Automobile": 100,
    "Housing/Mortgage": 100,
    "Personal Against Suretyship": 100,
    "Emergency Loan": 0,
  };
  
  if (isBranch) {
    if (isCashierOrController) {
      thresholds = {
        "Automobile": 95,
        "Housing/Mortgage": 95,
        "Personal Against Suretyship": 85,
        "Emergency Loan": 0,
      };
    } else {
      thresholds = {
        "Automobile": 70,
        "Housing/Mortgage": 70,
        "Personal Against Suretyship": 65,
        "Emergency Loan": 0,
      };
    }
  } else if (isDO) {
    thresholds = {
      "Automobile": 85,
      "Housing/Mortgage": 85,
      "Personal Against Suretyship": 75,
      "Emergency Loan": 0,
    };
  } else if (isHO) {
    thresholds = {
      "Automobile": 80,
      "Housing/Mortgage": 80,
      "Personal Against Suretyship": 70,
      "Emergency Loan": 0,
    };
  }
  
  return thresholds[loanType] ?? 100;
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
        business_email_address,
        organization_unit
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
        created_date,
        title,
        organizational_unit
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

    // 4. Team performance is removed, default to 0
    let teamPerformance = { band: 'Not rated', score: 0 };
    let branchVitalData = null;

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
        previous_position_title: performanceData?.title || null,
        date_of_hire: employee.company_entry_date,
        length_of_service_years: lengthOfServiceYears,
        phone_extension: employee.business_phone_number,
        email: employee.business_email_address || employee.outlook_address,
        organization_unit: employee.organization_unit || null,
        previous_organization_unit: performanceData?.organizational_unit || null,
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
      `SELECT r.*, 
        c.full_name AS checker_full_name, c.title AS checker_title, COALESCE(c.team, c.organization, c.department) AS checker_team,
        m.full_name AS manager_full_name, m.title AS manager_title, COALESCE(m.team, m.organization, m.department) AS manager_team
       FROM staff_loan_requests r
       LEFT JOIN public.users c ON LOWER(r.checker_verified_by) = LOWER(c.mail_address)
       LEFT JOIN public.users m ON LOWER(r.manager_verified_by) = LOWER(m.mail_address)
       WHERE r.id = $1`,
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
    loan_processing_branch,
    basic_salary,
    loan_application_count,
    retirement_date,
    attachment_file_name,
    employee_organization_unit,
    previous_position_title,
    previous_organization_unit,
    service_tenure_band,
    service_tenure_score,
    individual_performance_band,
    individual_performance_score,
    team_performance_band,
    team_performance_score,
    district_engagement_band,
    district_engagement_score,
    okr_kpi_band,
    okr_kpi_score,
    disciplinary_record_band,
    disciplinary_record_score,
    staff_declaration_confirmed,
    guarantor_basic_salary,
    guarantor_user,
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
  const svc = isEmergency ? 0 : (parseInt(service_tenure_score) || 0);
  const ind = isEmergency ? 0 : (parseInt(individual_performance_score) || 0);
  const team = isEmergency ? 0 : (parseInt(team_performance_score) || 0);
  const de = isEmergency ? 0 : (parseInt(district_engagement_score) || 0);
  const okr = isEmergency ? 0 : (parseInt(okr_kpi_score) || 0);
  const disc = isEmergency ? 0 : (parseInt(disciplinary_record_score) || 0);
  const total = svc + ind + team + de + okr + disc;

  const effectiveOrgUnit = previous_organization_unit || employee_organization_unit || "";
  const effectiveTitle = previous_position_title || position_title || "";
  const requiredThreshold = getRequiredThreshold(loan_type, effectiveOrgUnit, effectiveTitle);
  const scoreWithoutTenure = isEmergency ? 0 : (total - svc);
  const MAX_TENURE = 20;
  const wouldPassWithMaxTenure = (scoreWithoutTenure + MAX_TENURE) >= requiredThreshold;
  
  if (!isEmergency && total < requiredThreshold && !wouldPassWithMaxTenure) {
    return res.status(400).json({
      success: false,
      error: `Your total score (${total}) does not meet the required threshold (${requiredThreshold}) for this loan type. Even with a maximum tenure score, your score would be ${scoreWithoutTenure + MAX_TENURE}, which is still below the threshold.`
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO staff_loan_requests (
        employee_id, full_name, dob, branch_name, position_title,
        date_of_hire, length_of_service_years, phone_extension,
        date_of_request, loan_type, loan_amount_requested, loan_purpose,
        loan_processing_branch,
        basic_salary, loan_application_count, retirement_date,
        attachment_file_name,
        employee_organization_unit,
        previous_position_title,
        previous_organization_unit,
        service_tenure_band, service_tenure_score,
        individual_performance_band, individual_performance_score,
        team_performance_band, team_performance_score,
        district_engagement_band, district_engagement_score,
        okr_kpi_band, okr_kpi_score,
        disciplinary_record_band, disciplinary_record_score,
        total_score_claimed,
        staff_declaration_confirmed, staff_signature_date,
        guarantor_basic_salary, guarantor_user,
        status, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,$12,
        $13,
        $14,$15,$16,
        $17,
        $18,
        $19,
        $20,
        $21,$22,
        $23,$24,
        $25,$26,
        $27,$28,
        $29,$30,
        $31,$32,
        $33,
        $34,$35,
        $36, $37,
        $38,$39
      ) RETURNING *`,
      [
        employee_id, full_name, dob || null, branch_name, position_title,
        date_of_hire, length_of_service_years || null, phone_extension || null,
        date_of_request || new Date().toISOString().split('T')[0],
        loan_type, loan_amount_requested, loan_purpose || null,
        loan_processing_branch || null,
        basic_salary || null, loan_application_count || null, retirement_date || null,
        attachment_file_name || null,
        employee_organization_unit || null,
        previous_position_title || null,
        previous_organization_unit || null,
        isEmergency ? null : (service_tenure_band || null), svc,
        isEmergency ? null : (individual_performance_band || null), ind,
        isEmergency ? null : (team_performance_band || null), team,
        isEmergency ? null : (district_engagement_band || null), de,
        isEmergency ? null : (okr_kpi_band || null), okr,
        isEmergency ? null : (disciplinary_record_band || null), disc,
        total,
        staff_declaration_confirmed || false,
        staff_declaration_confirmed ? new Date().toISOString().split('T')[0] : null,
        guarantor_basic_salary || null,
        guarantor_user || null,
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
    loan_processing_branch,
    basic_salary,
    loan_application_count,
    retirement_date,
    attachment_file_name,
    employee_organization_unit,
    previous_position_title,
    previous_organization_unit,
    service_tenure_band,
    service_tenure_score,
    individual_performance_band,
    individual_performance_score,
    team_performance_band,
    team_performance_score,
    district_engagement_band,
    district_engagement_score,
    okr_kpi_band,
    okr_kpi_score,
    disciplinary_record_band,
    disciplinary_record_score,
    staff_declaration_confirmed,
    guarantor_basic_salary,
    guarantor_user,
    updated_by
  } = req.body;

  const isEmergency = loan_type === "Emergency Loan";

  const svc = isEmergency ? 0 : (parseInt(service_tenure_score) || 0);
  const ind = isEmergency ? 0 : (parseInt(individual_performance_score) || 0);
  const team = isEmergency ? 0 : (parseInt(team_performance_score) || 0);
  const de = isEmergency ? 0 : (parseInt(district_engagement_score) || 0);
  const okr = isEmergency ? 0 : (parseInt(okr_kpi_score) || 0);
  const disc = isEmergency ? 0 : (parseInt(disciplinary_record_score) || 0);
  const total_score_claimed = svc + ind + team + de + okr + disc;

  try {
    const existing = await pool.query(
      `SELECT employee_organization_unit, previous_organization_unit, position_title, previous_position_title 
       FROM staff_loan_requests WHERE id = $1`, [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Loan request not found"
      });
    }

    const reqData = existing.rows[0];
    const effectiveOrgUnit = previous_organization_unit || employee_organization_unit || reqData.previous_organization_unit || reqData.employee_organization_unit || "";
    const effectiveTitle = previous_position_title || reqData.previous_position_title || reqData.position_title || "";
    const requiredThreshold = getRequiredThreshold(loan_type, effectiveOrgUnit, effectiveTitle);
    const scoreWithoutTenure = isEmergency ? 0 : (total_score_claimed - svc);
    const MAX_TENURE = 20;
    const wouldPassWithMaxTenure = (scoreWithoutTenure + MAX_TENURE) >= requiredThreshold;
    
    if (!isEmergency && total_score_claimed < requiredThreshold && !wouldPassWithMaxTenure) {
      return res.status(400).json({
        success: false,
        error: `Your total score (${total_score_claimed}) does not meet the required threshold (${requiredThreshold}) for this loan type. Even with a maximum tenure score, your score would be ${scoreWithoutTenure + MAX_TENURE}, which is still below the threshold.`
      });
    }

    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        loan_type                        = COALESCE($1,  loan_type),
        loan_amount_requested            = COALESCE($2,  loan_amount_requested),
        loan_purpose                     = COALESCE($3,  loan_purpose),
        loan_processing_branch           = COALESCE($4,  loan_processing_branch),
        basic_salary                     = COALESCE($5,  basic_salary),
        loan_application_count           = COALESCE($6,  loan_application_count),
        retirement_date                  = COALESCE($7,  retirement_date),
        attachment_file_name             = COALESCE($8,  attachment_file_name),
        employee_organization_unit       = COALESCE($9,  employee_organization_unit),
        previous_position_title          = COALESCE($10, previous_position_title),
        previous_organization_unit       = COALESCE($11, previous_organization_unit),
        service_tenure_band              = $12,
        service_tenure_score             = $13,
        individual_performance_band      = $14,
        individual_performance_score     = $15,
        team_performance_band            = $16,
        team_performance_score           = $17,
        district_engagement_band         = $18,
        district_engagement_score        = $19,
        okr_kpi_band                     = $20,
        okr_kpi_score                    = $21,
        disciplinary_record_band         = $22,
        disciplinary_record_score        = $23,
        total_score_claimed              = $24,
        staff_declaration_confirmed      = COALESCE($25, staff_declaration_confirmed),
        staff_signature_date             = CASE WHEN $25 = true THEN CURRENT_DATE ELSE staff_signature_date END,
        guarantor_basic_salary           = COALESCE($26, guarantor_basic_salary),
        guarantor_user                   = COALESCE($27, guarantor_user),
        updated_by                       = $28
      WHERE id = $29
      RETURNING *`,
      [
        loan_type,
        loan_amount_requested,
        loan_purpose || null,
        loan_processing_branch || null,
        basic_salary,
        loan_application_count,
        retirement_date || null,
        attachment_file_name || null,
        employee_organization_unit || null,
        previous_position_title || null,
        previous_organization_unit || null,
        isEmergency ? null : (service_tenure_band || null),
        svc,
        isEmergency ? null : (individual_performance_band || null),
        ind,
        isEmergency ? null : (team_performance_band || null),
        team,
        isEmergency ? null : (district_engagement_band || null),
        de,
        isEmergency ? null : (okr_kpi_band || null),
        okr,
        isEmergency ? null : (disciplinary_record_band || null),
        disc,
        total_score_claimed,
        staff_declaration_confirmed,
        guarantor_basic_salary || null,
        guarantor_user || null,
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

// Update verification and review — LEGACY endpoint, superseded by manager-review + checker-review.
// Kept as a stub so existing route registrations don't cause import errors.
export const verifyAndReviewLoanRequest = async (req, res) => {
  res.status(410).json({
    success: false,
    error: "This endpoint is deprecated. Use POST /:id/manager-review and POST /:id/checker-review instead.",
  });
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
    try {
      fs.renameSync(tmpPath, finalPath);
    } catch (renameErr) {
      fs.copyFileSync(tmpPath, finalPath);
      try {
        fs.unlinkSync(tmpPath);
      } catch (unlinkErr) {
        console.warn("Could not delete temp file (likely locked), but copy succeeded:", unlinkErr.message);
      }
    }

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
    
    // updated borrower info
    basic_salary,

    // verified scores
    mgr_verified_service_score,
    mgr_verified_individual_score,
    mgr_verified_team_score,

    // fixed deductions (borrower)
    deduction_income_tax,
    deduction_pension_7,

    // dynamic extra deductions  [{label, amount}]
    deduction_other_items,

    // repayment fields
    deduction_amount,
    deduction_months,

    // outstanding balances [{label, amount}]
    outstanding_balances,

    // guarantor deduction fields
    guarantor_basic_salary,
    guarantor_deduction_income_tax,
    guarantor_deduction_pension_7,
    guarantor_deduction_other_items,
    guarantor_deduction_amount,
    guarantor_deduction_months,
    guarantor_outstanding_balances,

    loan_processor_assigned,
    manager_remarks,
  } = req.body;

  // ── Role enforcement ──────────────────────────────────────────────────────
  const allowedTitles = [
    "Manager, Payroll Administrator",
    "Enterprise System Operation and Application Developer",
  ];

  if (!reviewer_title || !allowedTitles.includes(reviewer_title.trim())) {
    return res.status(403).json({
      success: false,
      error:
        "Access denied. Only authorized Payroll reviewers can perform this review.",
    });
  }

  try {
    const existing = await pool.query(
      `SELECT id, basic_salary, manager_verified, loan_type,
              service_tenure_score, individual_performance_score,
              team_performance_score, disciplinary_record_score,
              district_engagement_score, okr_kpi_score,
              employee_organization_unit, previous_organization_unit,
              position_title, previous_position_title
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

    const existingBasicSalary = parseFloat(existing.rows[0].basic_salary) || 0;
    const finalBasicSalary = basic_salary !== undefined && basic_salary !== "" ? parseFloat(basic_salary) : existingBasicSalary;
    const isEmergency = existing.rows[0].loan_type === "Emergency Loan";

    // ── Use the system-calculated scores directly from DB (not editable by manager) ──
    const svcScore = existing.rows[0].service_tenure_score || 0;
    const indScore = existing.rows[0].individual_performance_score || 0;
    const teamScore = existing.rows[0].team_performance_score || 0;
    const deScore = existing.rows[0].district_engagement_score || 0;
    const okrScore = existing.rows[0].okr_kpi_score || 0;
    const discScore = existing.rows[0].disciplinary_record_score || 0;
    const totalScore = isEmergency ? 0 : (svcScore + indScore + teamScore + deScore + okrScore + discScore);

    const reqData = existing.rows[0];
    const orgUnit = reqData.previous_organization_unit || reqData.employee_organization_unit || "";
    const title = (reqData.previous_position_title || reqData.position_title || "").toLowerCase();

    const loanType = reqData.loan_type;
    const threshold = getRequiredThreshold(loanType, orgUnit, title);

    // Special review: fails threshold BUT the shortfall is entirely from tenure (C1).
    // Score without tenure + max tenure (20) would meet the threshold.
    const tenureScore = existing.rows[0].service_tenure_score || 0;
    const scoreWithoutTenure = isEmergency ? 0 : (totalScore - tenureScore);
    const MAX_TENURE = 20;
    const wouldPassWithMaxTenure = (scoreWithoutTenure + MAX_TENURE) >= threshold;
    const isSpecialReview = !isEmergency && totalScore < threshold && wouldPassWithMaxTenure;

    const finalDecision = isEmergency || totalScore >= threshold || isSpecialReview
      ? "Recommended"
      : "Not Recommended";
    const finalStatus = finalDecision;

    // ── Deduction calculations (borrower) ────────────────────────────────────
    const incomeTax = parseFloat(deduction_income_tax) || 0;
    const pension7 = parseFloat(deduction_pension_7) || 0;
    const loanRepay = parseFloat(deduction_amount) || 0;

    const otherItems = Array.isArray(deduction_other_items) ? deduction_other_items : [];
    const otherTotal = otherItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const totalDeduction = incomeTax + pension7 + loanRepay + otherTotal;
    const netSalary = finalBasicSalary - totalDeduction;

    // ── Guarantor deduction calculations ─────────────────────────────────────
    const gBasicSalary = parseFloat(guarantor_basic_salary) || 0;
    const gIncomeTax = parseFloat(guarantor_deduction_income_tax) || 0;
    const gPension7 = parseFloat(guarantor_deduction_pension_7) || 0;
    const gLoanRepay = parseFloat(guarantor_deduction_amount) || 0;

    const gOtherItems = Array.isArray(guarantor_deduction_other_items) ? guarantor_deduction_other_items : [];
    const gOtherTotal = gOtherItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const gTotalDeduction = gIncomeTax + gPension7 + gLoanRepay + gOtherTotal;
    const gNetSalary = gBasicSalary - gTotalDeduction;

    const result = await pool.query(
      `UPDATE staff_loan_requests SET
        manager_verified              = TRUE,
        manager_verified_by           = $1,
        manager_verified_at           = CURRENT_TIMESTAMP,
        mgr_verified_service_score    = $2,
        mgr_verified_individual_score = $3,
        mgr_verified_team_score       = $4,
        mgr_verified_total_score      = $5,
        basic_salary                  = $6,
        deduction_income_tax          = $7,
        deduction_pension_7           = $8,
        deduction_other_items         = $9,
        deduction_amount              = $10,
        deduction_months              = $11,
        total_deduction               = $12,
        net_salary_after_deduction    = $13,
        outstanding_balances          = $14,
        guarantor_basic_salary              = $15,
        guarantor_deduction_income_tax      = $16,
        guarantor_deduction_pension_7       = $17,
        guarantor_deduction_other_items     = $18,
        guarantor_deduction_amount          = $19,
        guarantor_deduction_months          = $20,
        guarantor_total_deduction           = $21,
        guarantor_net_salary_after_deduction= $22,
        guarantor_outstanding_balances      = $23,
        loan_processor_assigned             = $24,
        manager_remarks               = $25,
        status                        = $26,
        decision                      = $27,
        special_review                = $28,
        updated_at                    = CURRENT_TIMESTAMP
      WHERE id = $29
      RETURNING *`,
      [
        reviewer_email,
        isEmergency ? null : svcScore,
        isEmergency ? null : indScore,
        isEmergency ? null : teamScore,
        isEmergency ? 0 : totalScore,
        finalBasicSalary,
        incomeTax,
        pension7,
        JSON.stringify(otherItems),
        loanRepay,
        parseInt(deduction_months, 10) || 0,
        totalDeduction,
        netSalary,
        JSON.stringify(Array.isArray(outstanding_balances) ? outstanding_balances : []),
        gBasicSalary || null,
        gIncomeTax || null,
        gPension7 || null,
        JSON.stringify(gOtherItems),
        gLoanRepay || null,
        parseInt(guarantor_deduction_months, 10) || null,
        gTotalDeduction || null,
        gNetSalary || null,
        JSON.stringify(Array.isArray(guarantor_outstanding_balances) ? guarantor_outstanding_balances : []),
        loan_processor_assigned || null,
        manager_remarks || null,
        finalStatus,
        finalDecision,
        isSpecialReview,
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
    checker_disciplinary_band,            // text (optional correction)
    checker_loan_application_count,       // text (optional correction)
  } = req.body;

  // ── Role enforcement ──────────────────────────────────────────────────────
  const allowedTitles = [
    "Manager, Employee Services Management",
    "Enterprise System Operation and Application Developer",
  ];
  if (!reviewer_title || !allowedTitles.includes(reviewer_title.trim())) {
    return res.status(403).json({
      success: false,
      error:
        "Access denied. Only authorized Employee Services reviewers can perform this review.",
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
      `SELECT * FROM staff_loan_requests WHERE id = $1`,
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

    let finalDiscBand = existing.rows[0].disciplinary_record_band;
    let finalDiscScore = existing.rows[0].disciplinary_record_score;
    let finalLoanCount = existing.rows[0].loan_application_count;

    // Correct Disciplinary Record if flagged and a new band is provided
    if (!disciplinaryClean && checker_disciplinary_band) {
      finalDiscBand = checker_disciplinary_band;
      if (finalDiscBand.includes("Clean Record")) finalDiscScore = 10;
      else if (finalDiscBand.includes("Minor Sanction")) finalDiscScore = 5;
      else if (finalDiscBand.includes("Major Active Sanction")) finalDiscScore = 0;
    }

    // Correct Loan Application Count if flagged and a new count is provided
    if (!loanCountVerified && checker_loan_application_count) {
      finalLoanCount = checker_loan_application_count;
    }

    // Calculate new total score claimed
    const isEmergency = existing.rows[0].loan_type === "Emergency Loan";
    const svcScore = existing.rows[0].service_tenure_score || 0;
    const indScore = existing.rows[0].individual_performance_score || 0;
    const teamScore = existing.rows[0].team_performance_score || 0;
    const deScore = existing.rows[0].district_engagement_score || 0;
    const okrScore = existing.rows[0].okr_kpi_score || 0;
    const newTotalScore = isEmergency ? 0 : (svcScore + indScore + teamScore + deScore + okrScore + finalDiscScore);

    // If it's flagged and NOT corrected, we fail it. If it's flagged BUT corrected, we pass it forward.
    const isDiscResolved = disciplinaryClean || !!checker_disciplinary_band;
    const isLoanResolved = loanCountVerified || !!checker_loan_application_count;

    const finalStatus = (isDiscResolved && isLoanResolved) ? "Checker Review" : "Not Recommended";

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
        disciplinary_record_band             = $7,
        disciplinary_record_score            = $8,
        total_score_claimed                  = $9,
        loan_application_count               = $10,
        updated_at                           = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        reviewer_email,
        disciplinaryClean,
        loanCountVerified,
        checker_loan_application_remarks || null,
        checker_remarks || null,
        finalStatus,
        finalDiscBand,
        finalDiscScore,
        newTotalScore,
        finalLoanCount,
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

  const allowedTitles = [
    "Employee Approver",
    "Enterprise System Operation and Application Developer",
  ];
  if (!reviewer_title || !allowedTitles.includes(reviewer_title)) {
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
// Optional query param: ?assignedTo=<name> — filters to requests where loan_processor_assigned starts with that name
export const getRecommendedRequests = async (req, res) => {
  try {
    const { assignedTo } = req.query;
    let query = `SELECT * FROM staff_loan_requests WHERE status = 'Recommended'`;
    const params = [];
    if (assignedTo) {
      params.push(`%${assignedTo}%`);
      query += ` AND loan_processor_assigned ILIKE $1`;
    }
    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching recommended requests:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ── Guarantor Document Upload ─────────────────────────────────────────────────
export const uploadGuarantorDocument = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  try {
    const existing = await pool.query(
      "SELECT id, full_name, employee_id, loan_type, guarantor_attachment_file_name FROM staff_loan_requests WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      deleteLoanDocument(req.file.filename);
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    const row = existing.rows[0];

    // Build guarantor filename using same helper but with a "GUARANTOR_" prefix
    const baseFilename = buildLoanDocFilename(
      row.loan_type,
      row.full_name,
      row.employee_id,
      req.file.originalname
    );
    const finalFilename = `GUARANTOR_${baseFilename}`;

    // Rename temp file
    const tmpPath = path.join(UPLOAD_DIR, req.file.filename);
    const finalPath = path.join(UPLOAD_DIR, finalFilename);
    try {
      fs.renameSync(tmpPath, finalPath);
    } catch (renameErr) {
      fs.copyFileSync(tmpPath, finalPath);
      try { fs.unlinkSync(tmpPath); } catch (_) { }
    }

    // Remove old guarantor attachment if different
    if (row.guarantor_attachment_file_name && row.guarantor_attachment_file_name !== finalFilename) {
      deleteLoanDocument(row.guarantor_attachment_file_name);
    }

    const result = await pool.query(
      `UPDATE staff_loan_requests
       SET guarantor_attachment_file_name = $1,
           guarantor_attachment_file_path = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, guarantor_attachment_file_name, guarantor_attachment_file_path`,
      [
        finalFilename,
        `uploads/staff-loan-documents/${finalFilename}`,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Guarantor document uploaded successfully",
      data: {
        id: result.rows[0].id,
        filename: result.rows[0].guarantor_attachment_file_name,
        path: result.rows[0].guarantor_attachment_file_path,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error("Error uploading guarantor document:", err.message);
    deleteLoanDocument(req.file.filename);
    res.status(500).json({ success: false, error: "Server error during guarantor document upload" });
  }
};

// ── Guarantor Document Download / View ───────────────────────────────────────
export const downloadGuarantorDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT guarantor_attachment_file_name FROM staff_loan_requests WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    const { guarantor_attachment_file_name } = result.rows[0];

    if (!guarantor_attachment_file_name) {
      return res.status(404).json({ success: false, error: "No guarantor document attached to this request" });
    }

    const filepath = path.join(UPLOAD_DIR, guarantor_attachment_file_name);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: "Guarantor file not found on server" });
    }

    const ext = path.extname(guarantor_attachment_file_name).toLowerCase();
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
    res.setHeader("Content-Disposition", `inline; filename="${guarantor_attachment_file_name}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (err) {
    console.error("Error downloading guarantor document:", err.message);
    res.status(500).json({ success: false, error: "Server error during guarantor document download" });
  }
};

// ── Get loan requests where the logged-in user is the guarantor ───────────────
export const getRequestsByGuarantor = async (req, res) => {
  const { username } = req.params;
  try {
    // guarantor_user is stored as "Full Name (username)" — match either format
    const result = await pool.query(
      `SELECT * FROM staff_loan_requests
       WHERE guarantor_user ILIKE $1
          OR guarantor_user ILIKE $2
          OR guarantor_username ILIKE $3
       ORDER BY created_at DESC`,
      [`%(${username})`, `%${username}%`, username]
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching guarantor requests:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ── Guarantor submits consent (accept / decline) ──────────────────────────────
export const guarantorConsent = async (req, res) => {
  const { id } = req.params;
  const { decision, remarks, guarantor_email } = req.body;
  // decision must be "Accepted" or "Declined"
  if (!["Accepted", "Declined"].includes(decision)) {
    return res.status(400).json({ success: false, error: "Decision must be 'Accepted' or 'Declined'" });
  }

  try {
    const result = await pool.query(
      `UPDATE staff_loan_requests
       SET guarantor_consent         = $1,
           guarantor_consent_at      = NOW(),
           guarantor_consent_remarks = $2
       WHERE id = $3
       RETURNING *`,
      [decision, remarks || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Loan request not found" });
    }

    res.json({
      success: true,
      message: `Guarantor consent recorded: ${decision}`,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error recording guarantor consent:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
