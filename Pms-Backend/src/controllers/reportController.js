import pool from "../db.js";

// ================= USER TARGETS REPORT =================
// Returns all users (scoped by role/position) LEFT JOINed with
// their financial target and non-financial target rows.
// Users with no targets still appear with null target columns.
export const getUserTargetsReport = async (req, res) => {
  const { user_id, position, role, team, subprocess, process, organization } = req.body;
  if (!user_id || !position) {
    return res.status(400).json({ error: "user_id and position are required" });
  }

  try {
    const isAdmin = role === "Admin";

    // Base SELECT – flat row per user
    const selectClause = `
      SELECT
        -- User Info
        u.user_name,
        u.full_name,
        u.department,
        u.position,
        u.title,
        u.team,
        u.subprocess,
        u.process,
        u.organization,
        u.role,
        u.mail_address,
        u.cbsusername,

        -- Financial Target
        t.target_id          AS fin_target_id,
        t.deposit_target,
        t.fcy_target,
        t.loan_collection,
        t.cash_collection,
        t.cash_deposited_crm,
        t.status             AS fin_status,
        t.created_by         AS fin_created_by,
        t.approved_by        AS fin_approved_by,
        t.created_at         AS fin_created_at,

        -- Non-Financial Target
        ndt.target_id        AS nonfin_target_id,
        ndt.new_account,
        ndt.unauthorized_transaction,
        ndt.active_card_no,
        ndt.eeu_transaction_count,
        ndt.merchant_recruitment,
        ndt.merchant_transaction_volume,
        ndt.agent_recruitment,
        ndt.agent_transaction_volume,
        ndt.michu_unique_recruitment,
        ndt.digital_transaction_volume,
        ndt.coopay_ebirr_activation,
        ndt.atm_crm_uptime_rate,
        ndt.cash_balance_accuracy_rate,
        ndt.zero_customer_complaints,
        ndt.avg_txn_per_cso,
        ndt.compliance_rate,
        ndt.reports_3days_rate,
        ndt.audit_report_quality,
        ndt.cash_surprise_checks,
        ndt.employee_perf_threshold,
        ndt.transaction_audit_rate,
        ndt.customer_engagement,
        ndt.new_customer_onboarding,
        ndt.armingc_deposit_proportion,
        ndt.gl,
        ndt.status           AS nonfin_status,
        ndt.created_by       AS nonfin_created_by,
        ndt.approved_by      AS nonfin_approved_by

      FROM public.users u
      LEFT JOIN public.targets t
        ON u.user_name = t.user_name
      LEFT JOIN public.non_deposit_target ndt
        ON u.user_name = ndt.user_name
    `;

    let whereClause = "";
    let values = [];

    if (isAdmin) {
      // Admin sees all users – no WHERE
      whereClause = "";
    } else if (position === "CRM" || position === "Individual") {
      whereClause = `WHERE u.user_name = $1`;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director" || ((team?.includes("Human Capital Business Partner") || team?.includes("Strategy Implementation and Monitoring")) && organization === "Do")) {
      whereClause = `WHERE u.subprocess = $1`;
      values = [subprocess];
    } else if (position === "Manager") {
      whereClause = `WHERE u.team = $1`;
      values = [team];
    } else if (position === "VP" || position === "CHF") {
      whereClause = `WHERE u.process = $1`;
      values = [process];
    } else if (position === "CEO") {
      whereClause = "";
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const query = `${selectClause} ${whereClause} ORDER BY u.user_name`;
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("getUserTargetsReport error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= ACCOUNT MAPPING REPORT =================
// Returns user information with their mapped accounts.
// Implements server-side pagination due to millions of records in accountmapping table.
export const getAccountMappingReport = async (req, res) => {
  try {
    const {
      user_id, position, role, team, subprocess, process, organization,
      page = 0, limit = 10, searchTerm = "", district = "", isExport = false
    } = req.body;

    if (!user_id || !position) {
      return res.status(400).json({ error: "user_id and position are required" });
    }

    const isAdmin = role === "Admin";

    if (isExport && !isAdmin) {
      return res.status(403).json({ error: "Export is only allowed for Admin" });
    }
    if (isExport && !district) {
      return res.status(400).json({ error: "Export requires filtering by a specific district" });
    }

    const offset = page * limit;

    // Base WHERE conditions
    let conditions = ["1=1"];
    let values = [];
    let paramIndex = 1;

    // 1. Role-based scoping (similar to User Targets)
    if (!isAdmin) {
      if (position === "CRM" || position === "Individual") {
        conditions.push(`u.user_name = $${paramIndex++}`);
        values.push(user_id);
      } else if (position === "Director" || position === "Senior Director" || ((team?.includes("Human Capital Business Partner") || team?.includes("Strategy Implementation and Monitoring")) && organization === "Do")) {
        conditions.push(`u.subprocess = $${paramIndex++}`);
        values.push(subprocess);
      } else if (position === "Manager") {
        conditions.push(`u.team = $${paramIndex++}`);
        values.push(team);
      } else if (position === "VP" || position === "CHF") {
        conditions.push(`u.process = $${paramIndex++}`);
        values.push(process);
      } else if (position === "CEO") {
        // CEO sees all
      } else {
        return res.status(400).json({ error: "Invalid position" });
      }
    }

    // 2. Additional filters
    if (searchTerm) {
      conditions.push(`(u.user_name ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR am.account_number ILIKE $${paramIndex})`);
      values.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (district) {
      conditions.push(`u.subprocess ILIKE $${paramIndex++}`);
      values.push(`%${district}%`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Query 1: Get Total Count for Pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM public.accountmapping am
      LEFT JOIN public.users u ON am.user_name = u.user_name
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Query 2: Get Paginated Data
    const dataQuery = `
      SELECT 
        u.user_name,
        u.full_name,
        u.department,
        u.position,
        u.title,
        u.team,
        u.subprocess,
        u.process,
        u.organization,
        am.account_number,
        am.created_at
      FROM public.accountmapping am
      LEFT JOIN public.users u ON am.user_name = u.user_name
      ${whereClause}
      ORDER BY u.subprocess ASC, u.user_name ASC, am.created_at DESC
      ${isExport ? "" : `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`}
    `;

    // Create a copy of values for the data query and add limit/offset
    const dataValues = isExport ? [...values] : [...values, limit, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    res.status(200).json({
      data: dataResult.rows,
      totalCount
    });

  } catch (err) {
    console.error("getAccountMappingReport error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= ACCOUNT VARIATION REPORT =================
export const getAccountVariationReport = async (req, res) => {
  try {
    const {
      user_id, position, role, team, subprocess, process, organization, tabType
    } = req.body;

    if (!user_id || !position || !tabType) {
      return res.status(400).json({ error: "user_id, position, and tabType are required" });
    }

    const isAdmin = role === "Admin";

    // Base WHERE conditions for scoping
    let conditions = ["1=1"];
    let values = [];
    let paramIndex = 1;

    // 1. Role-based scoping
    if (!isAdmin) {
      if (position === "CRM" || position === "Individual") {
        conditions.push(`u.user_name = $${paramIndex++}`);
        values.push(user_id);
      } else if (position === "Director" || position === "Senior Director" || ((team?.includes("Human Capital Business Partner") || team?.includes("Strategy Implementation and Monitoring")) && organization === "Do")) {
        if (subprocess) {
          conditions.push(`u.subprocess = $${paramIndex++}`);
          values.push(subprocess);
        }
      } else if (position === "Manager") {
        if (team) {
          conditions.push(`u.team = $${paramIndex++}`);
          values.push(team);
        }
      } else if (position === "VP" || position === "CHF") {
        if (process) {
          conditions.push(`u.process = $${paramIndex++}`);
          values.push(process);
        }
      } else if (position === "CEO") {
        // CEO sees all
      } else {
        return res.status(400).json({ error: "Invalid position" });
      }
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    let query = "";

    switch (tabType) {
      case "local":
        query = `
          SELECT 
            u.user_name,
            u.full_name,
            u.position,
            u.title,
            u.process,
            u.subprocess,
            u.team as branch,
            COUNT(am.map_id) as mapped_accounts_count,
            SUM(am.beginning_balance) as total_beginning_balance,
            SUM(am.current_balance) as total_current_balance,
            SUM(am.current_balance) - SUM(am.beginning_balance) as variation,
            COALESCE(MAX(t.deposit_target), 0) AS deposit_target
          FROM public.users u
          LEFT JOIN public.accountmapping am ON u.user_name = am.user_name
          LEFT JOIN public.targets t ON u.user_name = t.user_name
          ${whereClause}
          GROUP BY u.user_name, u.full_name, u.position, u.title, u.process, u.subprocess, u.team
        `;
        break;
      case "fcy":
        query = `
          SELECT 
            u.user_name,
            u.full_name,
            u.position,
            u.title,
            u.process,
            u.subprocess,
            u.team as branch,
            COUNT(amf.map_id) as mapped_accounts_count,
            SUM(amf.beginning_balance) as total_beginning_balance,
            SUM(amf.current_balance) as total_current_balance,
            SUM(COALESCE(amf."LCY_CLOSING_BALANCE", 0)) - SUM(COALESCE(amf."LCY_BEGINIG_BALANCE", 0)) as total_lcy_closing_balance
          FROM public.users u
          LEFT JOIN public.accountmappingfcy amf ON u.user_name = amf.user_name
          ${whereClause}
          GROUP BY u.user_name, u.full_name, u.position, u.title, u.process, u.subprocess, u.team
        `;
        break;
      case "loan":
        query = `
          SELECT 
            u.user_name,
            u.full_name,
            u.position,
            u.title,
            u.process,
            u.subprocess,
            u.team as branch,
            COUNT(lm.map_id) as loan_accounts_count,
            SUM(lm.collected_balance) as total_collected_balance,
            SUM(lm.outstanding_balance) as total_outstanding_balance,
            COALESCE(MAX(t.loan_collection), 0) AS loan_collection_target
          FROM public.users u
          LEFT JOIN public.loanaccountmapping lm ON u.user_name = lm.user_name
          LEFT JOIN public.targets t ON u.user_name = t.user_name
          ${whereClause}
          GROUP BY u.user_name, u.full_name, u.position, u.title, u.process, u.subprocess, u.team
        `;
        break;
      case "fcy-gen":
        query = `
          SELECT 
            u.user_name,
            u.full_name,
            u.position,
            u.title,
            u.process,
            u.subprocess,
            u.team as branch,
            COUNT(fd.fcy_id) as fcy_generation_count,
            SUM(fd.amount) as total_amount,
            COALESCE(MAX(t.fcy_target), 0) AS fcy_target
          FROM public.users u
          LEFT JOIN public.fcydeposit fd ON u.user_name = fd.user_name AND fd.status = 'Approved'
          LEFT JOIN public.targets t ON u.user_name = t.user_name
          ${whereClause}
          GROUP BY u.user_name, u.full_name, u.position, u.title, u.process, u.subprocess, u.team
        `;
        break;
      case "manual-cash": {
        let mcConds = ["1=1"];
        let mcVals = [];
        let pIdx = 1;
        if (!isAdmin) {
          if (process && (position === "VP" || position === "CHF")) {
            mcConds.push(`d."PROCESS" = $${pIdx++}`);
            mcVals.push(process);
          } else if (subprocess && (position === "Director" || position === "Senior Director")) {
            mcConds.push(`d."SUBPROCESS" = $${pIdx++}`);
            mcVals.push(subprocess);
          } else if (team && position === "Manager") {
            mcConds.push(`b.branch_name = $${pIdx++}`);
            mcVals.push(team);
          }
        }
        query = `
          SELECT 
            d."DISTRICT_NAME", 
            b.branch_name AS "BRANCH_NAME", 
            d."BRANCH_CODE", 
            d."TOTAL_CASH_CREDIT", 
            d."PROCESS", 
            d."SUBPROCESS"
          FROM public."DW_CASH_COLLECTION_BY_BRANCH" d
          LEFT JOIN public.branches b ON d."BRANCH_CODE" = b.branch_code
          WHERE ${mcConds.join(" AND ")}
        `;
        values = mcVals;
        break;
      }
      case "crm-cash": {
        let ccConds = ["1=1"];
        let ccVals = [];
        let pIdx = 1;
        if (!isAdmin) {
          if (process && (position === "VP" || position === "CHF")) {
            ccConds.push(`d."PROCESS" = $${pIdx++}`);
            ccVals.push(process);
          } else if (subprocess && (position === "Director" || position === "Senior Director")) {
            ccConds.push(`d."SUBPROCESS" = $${pIdx++}`);
            ccVals.push(subprocess);
          } else if (team && position === "Manager") {
            ccConds.push(`b.branch_name = $${pIdx++}`);
            ccVals.push(team);
          }
        }
        query = `
          SELECT 
            d."BRANCH_CODE", 
            b.branch_name AS "BRANCH_NAME", 
            d."TOTAL_COLLECTED_CASH", 
            d."PROCESS", 
            d."SUBPROCESS"
          FROM public."DW_CASH_COLLECTION_BY_CRM" d
          LEFT JOIN public.branches b ON d."BRANCH_CODE" = b.branch_code
          WHERE ${ccConds.join(" AND ")}
        `;
        values = ccVals;
        break;
      }
      case "loan-collection-branch": {
        let lcConds = ["1=1"];
        let lcVals = [];
        let pIdx = 1;
        if (!isAdmin) {
          if (process && (position === "VP" || position === "CHF")) {
            lcConds.push(`d."PROCESS" = $${pIdx++}`);
            lcVals.push(process);
          } else if (subprocess && (position === "Director" || position === "Senior Director")) {
            lcConds.push(`d."SUBPROCESS" = $${pIdx++}`);
            lcVals.push(subprocess);
          } else if (team && position === "Manager") {
            lcConds.push(`b.branch_name = $${pIdx++}`);
            lcVals.push(team);
          }
        }
        query = `
          SELECT 
            b.branch_name AS "BRANCH_NAME", 
            d."CO_CODE", 
            d."TOTAL_COLLECTION", 
            d."LOAN_DUE_COLLECTION", 
            d."PROCESS", 
            d."SUBPROCESS"
          FROM public."DW_LOAN_DUE_COLLECTION" d
          LEFT JOIN public.branches b ON d."CO_CODE" = b.branch_code
          WHERE ${lcConds.join(" AND ")}
        `;
        values = lcVals;
        break;
      }
      default:
        return res.status(400).json({ error: "Invalid tabType" });
    }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);

  } catch (err) {
    console.error("getAccountVariationReport error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= FCY DEPOSIT REPORT =================
export const getFcyDepositReport = async (req, res) => {
  try {
    const {
      user_id, position, role, team, subprocess, process, organization,
      page = 0, limit = 10, searchTerm = "", filterProcess = "", filterSubprocess = "", filterTeam = "", isExport = false
    } = req.body;

    if (!user_id || !position) {
      return res.status(400).json({ error: "user_id and position are required" });
    }

    const isAdmin = role === "Admin";

    const offset = page * limit;

    // Base WHERE conditions
    let conditions = ["fcy.status = 'Approved'"];
    let values = [];
    let paramIndex = 1;

    // 1. Role-based scoping (similar to User Targets)
    if (!isAdmin) {
      if (position === "CRM" || position === "Individual") {
        conditions.push(`fcy.user_name = $${paramIndex++}`);
        values.push(user_id);
      } else if (position === "Director" || position === "Senior Director" || ((team?.includes("Human Capital Business Partner") || team?.includes("Strategy Implementation and Monitoring")) && organization === "Do")) {
        conditions.push(`fcy.subprocess = $${paramIndex++}`);
        values.push(subprocess);
      } else if (position === "Manager") {
        conditions.push(`fcy.team = $${paramIndex++}`);
        values.push(team);
      } else if (position === "VP" || position === "CHF") {
        conditions.push(`fcy.process = $${paramIndex++}`);
        values.push(process);
      } else if (position === "CEO") {
        // CEO sees all
      } else {
        return res.status(400).json({ error: "Invalid position" });
      }
    }

    // 2. Additional filters
    if (searchTerm) {
      conditions.push(`(u1.full_name ILIKE $${paramIndex} OR fcy.user_name ILIKE $${paramIndex} OR fcy.account_number ILIKE $${paramIndex} OR fcy.account_holder ILIKE $${paramIndex})`);
      values.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (filterProcess) {
      conditions.push(`fcy.process ILIKE $${paramIndex++}`);
      values.push(`%${filterProcess}%`);
    }

    if (filterSubprocess) {
      conditions.push(`fcy.subprocess ILIKE $${paramIndex++}`);
      values.push(`%${filterSubprocess}%`);
    }

    if (filterTeam) {
      conditions.push(`fcy.team ILIKE $${paramIndex++}`);
      values.push(`%${filterTeam}%`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Query 1: Get Total Count for Pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM public.fcydeposit fcy
      LEFT JOIN public.users u1 ON fcy.user_name = u1.user_name
      LEFT JOIN public.users u2 ON fcy.approvedby = u2.user_name
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Query 2: Get Paginated Data
    const paginationClause = isExport ? "" : `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const dataQuery = `
      SELECT 
        fcy.fcy_id, u1.full_name, u1.title, fcy.account_number, fcy.account_holder, fcy.amount, fcy.reference, fcy.user_name, fcy.created_at, fcy.process, fcy.subprocess, fcy.team, fcy.crm_name, fcy.status, fcy.createdby, u2.full_name AS approvedby, fcy.is_shared
      FROM public.fcydeposit fcy
      LEFT JOIN public.users u1 ON fcy.user_name = u1.user_name
      LEFT JOIN public.users u2 ON fcy.approvedby = u2.user_name
      ${whereClause}
      ORDER BY fcy.created_at DESC
      ${paginationClause}
    `;

    // Create a copy of values for the data query and add limit/offset
    const dataValues = isExport ? [...values] : [...values, limit, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    res.status(200).json({
      data: dataResult.rows,
      totalCount
    });

  } catch (err) {
    console.error("getFcyDepositReport error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= EVALUATION RESULT REPORT =================
export const getEvaluationResultReport = async (req, res) => {
  try {
    const {
      user_id, fullname, email, position, role, team, subprocess, process, organization,
      page = 0, limit = 10, searchTerm = "", district = "", isExport = false
    } = req.body;

    if (!user_id || !position) {
      return res.status(400).json({ error: "user_id and position are required" });
    }

    const isAdmin = role === "Admin";
    const offset = page * limit;

    let conditions = ["1=1"];
    let values = [];
    let paramIndex = 1;

    // Role-based scoping
    if (!isAdmin) {
      if (position === "CRM" || position === "Individual") {
        // Wait, if user_id is user_name and we have username/mail in table
        conditions.push(`(e.mail = $${paramIndex})`);
        values.push(email);
        paramIndex++;
      } else if (position === "Director" || position === "Senior Director" || ((team?.includes("Human Capital Business Partner") || team?.includes("Strategy Implementation and Monitoring")) && organization === "Do")) {
        conditions.push(`e.subprocess = $${paramIndex++}`);
        values.push(subprocess);
      } else if (position === "Manager") {
        conditions.push(`e.branch = $${paramIndex++}`);
        values.push(team);
      } else if (position === "VP" || position === "CHF") {
        conditions.push(`e.process = $${paramIndex++}`);
        values.push(process);
      } else if (position === "CEO") {
        // CEO sees all
      } else {
        return res.status(400).json({ error: "Invalid position" });
      }
    }

    if (searchTerm) {
      conditions.push(`(e.fullname ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR e.username ILIKE $${paramIndex})`);
      values.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (district) {
      conditions.push(`e.branch ILIKE $${paramIndex++}`);
      values.push(`%${district}%`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countQuery = `
      SELECT COUNT(*) 
      FROM public.employee_evaluation_result e
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const paginationClause = isExport ? "" : `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const dataQuery = `
      SELECT 
        id, username, fullname, mail, employee_id, process, subprocess, branch, title, "position", 
        performance_result, performance_status, strategic_recommendation, created_date, created_by
      FROM public.employee_evaluation_result e
      ${whereClause}
      ORDER BY e.created_date DESC
      ${paginationClause}
    `;

    const dataValues = isExport ? [...values] : [...values, limit, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    res.status(200).json({
      data: dataResult.rows,
      totalCount
    });

  } catch (err) {
    console.error("getEvaluationResultReport error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

