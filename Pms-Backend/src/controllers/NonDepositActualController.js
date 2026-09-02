import pool from "../db.js";

/* =========================================================
   1. NEW ACCOUNTS SUMMARY
========================================================= */
export const getNewAccountsSummaryByUser = async (req, res) => {
  const { cbsusername, user_name, position, subprocess, process } = req.body;

  try {
    let query = "";
    let values = [];

    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT COALESCE(SUM("NO_OF_NEW_ACCTS"), 0) AS total_accounts
        FROM public."DW_NEW_ACCOUNTS"
        WHERE "INPUTTER" = $1
      `;
      values = [cbsusername];
    } else if (position === "Manager") {
      query = `
        SELECT COALESCE(SUM("NO_OF_NEW_ACCTS"), 0) AS total_accounts
        FROM public."DW_NEW_ACCOUNTS" a
        JOIN public.users u 
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_name];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT COALESCE(SUM("NO_OF_NEW_ACCTS"), 0) AS total_accounts
        FROM public."DW_NEW_ACCOUNTS"
        WHERE "SUBPROCESS" = $1
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT COALESCE(SUM("NO_OF_NEW_ACCTS"), 0) AS total_accounts
        FROM public."DW_NEW_ACCOUNTS"
        WHERE "PROCESS" = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT COALESCE(SUM("NO_OF_NEW_ACCTS"), 0) AS total_accounts
        FROM public."DW_NEW_ACCOUNTS"
      `;
    }

    const result = await pool.query(query, values);

    res.json({
      total_accounts: result.rows[0]?.total_accounts || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
/* =========================================================
   2. NAU TRANSACTIONS SUMMARY
========================================================= */
export const getNauTxnSummaryByUser = async (req, res) => {
  const { cbsusername, user_id, team, position, subprocess, process } = req.body;
  try {
    let query = "";
    let values = [];

    // ===============================
    // CRM / Individual (INPUTTER based)
    // ===============================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a."COUNT_NAU_TXN"), 0) AS total_unauthorized
        FROM public."DW_NAU_TXN" a
        JOIN public.users u 
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // ===============================
      // Manager (Branch mapping via users table)
      // ===============================
    } else if (position === "Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a."COUNT_NAU_TXN"), 0) AS total_unauthorized
        FROM public."DW_NAU_TXN" a
        JOIN public.users u 
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // ===============================
      // Director (Branch Name / Subprocess)
      // ===============================
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          COALESCE(SUM("COUNT_NAU_TXN"), 0) AS total_unauthorized
        FROM public."DW_NAU_TXN"
        WHERE "SUBPROCESS" = $1
      `;
      values = [subprocess];

      // ===============================
      // VP / CHF (Branch Code / Process)
      // ===============================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          COALESCE(SUM("COUNT_NAU_TXN"), 0) AS total_unauthorized
        FROM public."DW_NAU_TXN"
        WHERE "PROCESS" = $1
      `;
      values = [process];

      // ===============================
      // CEO (No filter - full data)
      // ===============================
    } else if (position === "CEO") {
      query = `
        SELECT 
          COALESCE(SUM("COUNT_NAU_TXN"), 0) AS total_unauthorized
        FROM public."DW_NAU_TXN"
      `;
      values = [];

      // ===============================
      // INVALID POSITION SAFETY
      // ===============================
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    // ===============================
    // EXECUTE QUERY
    // ===============================
    const result = await pool.query(query, values);

    return res.json({
      total_unauthorized: result.rows[0]?.total_unauthorized || 0,
    });
  } catch (err) {
    console.error("NAU TXN ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
export const getEeuPaymentsSummaryByUser = async (req, res) => {
  const { cbsusername, user_id, position, subprocess, process } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      // query = `
      //   SELECT 
      //     COALESCE(SUM(p."TXN_COUNT"), 0) AS total_txn_count,
      //     COALESCE(SUM(p."TXN_AMOUNT"), 0) AS total_txn_amount
      //   FROM public."DW_EEU_PAYMENTS" p
      //   WHERE p."BRANCH_CODE" = (
      //     SELECT u."company_code"
      //     FROM public.users u
      //     WHERE u."cbsusername" = $1
      //     LIMIT 1
      //   )
      // `;
      // values = [cbsusername];
      query = `
    SELECT 
      COALESCE(SUM(p."TXN_COUNT"), 0) AS total_txn_count,
      COALESCE(SUM(p."TXN_AMOUNT"), 0) AS total_txn_amount
    FROM public."DW_EEU_PAYMENTS" p
    JOIN public.users u 
      ON u.company_code = p."BRANCH_CODE"
    WHERE u.user_name = $1
  `;
      values = [user_id];
      // =========================
      // Director
      // =========================
    } else if (position === "Manager") {
      query = `
    SELECT 
      COALESCE(SUM(p."TXN_COUNT"), 0) AS total_txn_count,
      COALESCE(SUM(p."TXN_AMOUNT"), 0) AS total_txn_amount
    FROM public."DW_EEU_PAYMENTS" p
    JOIN public.users u 
      ON u.company_code = p."BRANCH_CODE"
    WHERE u.user_name = $1
  `;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          COALESCE(SUM(p."TXN_COUNT"), 0) AS total_txn_count,
          COALESCE(SUM(p."TXN_AMOUNT"), 0) AS total_txn_amount
        FROM public."DW_EEU_PAYMENTS" p
        WHERE p."SUBPROCESS" = $1
      `;
      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          COALESCE(SUM(p."TXN_COUNT"), 0) AS total_txn_count,
          COALESCE(SUM(p."TXN_AMOUNT"), 0) AS total_txn_amount
        FROM public."DW_EEU_PAYMENTS" p
        WHERE p."PROCESS" = $1
      `;
      values = [process];

      // =========================
      // CEO (all data)
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          COALESCE(SUM(p."TXN_COUNT"), 0) AS total_txn_count,
          COALESCE(SUM(p."TXN_AMOUNT"), 0) AS total_txn_amount
        FROM public."DW_EEU_PAYMENTS" p
      `;
    }

    const result = await pool.query(query, values);

    res.json({
      total_txn_count: result.rows[0].total_txn_count || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
export const getActiveCardUsersSummaryByUser = async (req, res) => {
  const { cbsusername, position, user_name, subprocess, process } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
          SELECT 
              COALESCE(SUM(a."NO_OF_ACTIVE_CARD_USERS"), 0) AS total_active_card_users
          FROM public."PMS_ACTIVE_CARD_USERS" a
          WHERE a."INPUTTER" = (
              SELECT u."cbsusername"
              FROM public.users u
              WHERE u."cbsusername" = $1 AND a."CO_CODE" = u.company_code
              LIMIT 1
          );
      `;
      values = [cbsusername];
      //     query = `
      //   SELECT 
      //     COALESCE(SUM(a."NO_OF_ACTIVE_CARD_USERS"), 0) AS total_active_card_users
      //   FROM public."PMS_ACTIVE_CARD_USERS" a
      //   JOIN public.users u 
      //     ON u.company_code = a."CO_CODE"
      //   WHERE u.user_name = $1
      // `;
      //     values = [user_name];
    } else if (position === "Manager") {
      query = `
    SELECT 
      COALESCE(SUM(a."NO_OF_ACTIVE_CARD_USERS"), 0) AS total_active_card_users
    FROM public."PMS_ACTIVE_CARD_USERS" a
    JOIN public.users u 
      ON u.company_code = a."CO_CODE"
    WHERE u.user_name = $1
  `;
      values = [user_name];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          COALESCE(SUM(a."NO_OF_ACTIVE_CARD_USERS"), 0) AS total_active_card_users
        FROM public."PMS_ACTIVE_CARD_USERS" a
        WHERE a."SUBPROCESS" = $1
      `;
      values = [subprocess];

      // =========================
      // VP / CHF (Branch level)
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          COALESCE(SUM(a."NO_OF_ACTIVE_CARD_USERS"), 0) AS total_active_card_users
        FROM public."PMS_ACTIVE_CARD_USERS" a
        WHERE a."PROCESS" = $1
      `;
      values = [process];

      // =========================
      // CEO (All data)
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
    
          COALESCE(SUM(a."NO_OF_ACTIVE_CARD_USERS"), 0) AS total_active_card_users
        FROM public."PMS_ACTIVE_CARD_USERS" a

      `;
    }

    const result = await pool.query(query, values);

    res.json({
      total_active_card_users: result.rows[0].total_active_card_users || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
export const getDigitalTxnPercentageSummaryByUser = async (req, res) => {
  const { cbsusername, position, user_id, subprocess, process } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a. "DIGITAL_TXN_PERCENTAGE"), 0) AS digital_txn_percentage,
          COALESCE(SUM(a."DIGITAL_TXN_COUNT"), 0) AS total_digital_txn_count,
          COALESCE(SUM(a."TOTAL_TXN_COUNT"), 0) AS total_txn_count
        FROM public."DW_DIGITAL_TXN_PERCENTAGE" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // =========================
      // Manager
      // =========================
    } else if (position === "Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a. "DIGITAL_TXN_PERCENTAGE"), 0) AS digital_txn_percentage,
          COALESCE(SUM(a."DIGITAL_TXN_COUNT"), 0) AS total_digital_txn_count,
          COALESCE(SUM(a."TOTAL_TXN_COUNT"), 0) AS total_txn_count
        FROM public."DW_DIGITAL_TXN_PERCENTAGE" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // =========================
      // Director
      // =========================
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          a."SUBPROCESS",
          COALESCE(SUM(a. "DIGITAL_TXN_PERCENTAGE"), 0) AS digital_txn_percentage,
          COALESCE(SUM(a."DIGITAL_TXN_COUNT"), 0) AS total_digital_txn_count,
          COALESCE(SUM(a."TOTAL_TXN_COUNT"), 0) AS total_txn_count
        FROM public."DW_DIGITAL_TXN_PERCENTAGE" a
        WHERE a."SUBPROCESS" = $1
        GROUP BY a."SUBPROCESS"
      `;
      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          a."BRANCH_NAME",
          COALESCE(SUM(a. "DIGITAL_TXN_PERCENTAGE"), 0) AS digital_txn_percentage,
          COALESCE(SUM(a."DIGITAL_TXN_COUNT"), 0) AS total_digital_txn_count,
          COALESCE(SUM(a."TOTAL_TXN_COUNT"), 0) AS total_txn_count
        FROM public."DW_DIGITAL_TXN_PERCENTAGE" a
        WHERE a."PROCESS" = $1
        GROUP BY a."BRANCH_NAME"
      `;
      values = [process];

      // =========================
      // CEO
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          a."PROCESS",
          a."SUBPROCESS",
          COALESCE(SUM(a. "DIGITAL_TXN_PERCENTAGE"), 0) AS digital_txn_percentage,
          COALESCE(SUM(a."DIGITAL_TXN_COUNT"), 0) AS total_digital_txn_count,
          COALESCE(SUM(a."TOTAL_TXN_COUNT"), 0) AS total_txn_count
        FROM public."DW_DIGITAL_TXN_PERCENTAGE" a
        GROUP BY a."PROCESS", a."SUBPROCESS"
        ORDER BY a."PROCESS"
      `;
    }

    const result = await pool.query(query, values);

    res.json({
      total_digital_txn_count:
        result.rows[0]?.total_digital_txn_count || 0,

      total_txn_count:
        result.rows[0]?.total_txn_count || 0,

      digital_txn_percentage:
        result.rows[0]?.digital_txn_percentage || 0,

      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
};

export const getAuditedTxnSummaryByUser = async (req, res) => {
  const { cbsusername, position, user_id, subprocess, process } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a."AUDITED_TXN_COUNT"), 0) AS total_audited_txn_count
        FROM public."DW_AUDITED_TXN" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // =========================
      // Manager
      // =========================
    } else if (position === "Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a."AUDITED_TXN_COUNT"), 0) AS total_audited_txn_count
        FROM public."DW_AUDITED_TXN" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // =========================
      // Director
      // =========================
    } else if (position === "Director") {
      query = `
        SELECT 
          a."SUBPROCESS",
          COALESCE(SUM(a."AUDITED_TXN_COUNT"), 0) AS total_audited_txn_count
        FROM public."DW_AUDITED_TXN" a
        WHERE a."PROCESS" = $1
        GROUP BY a."SUBPROCESS"
      `;
      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          a."BRANCH_NAME",
          COALESCE(SUM(a."AUDITED_TXN_COUNT"), 0) AS total_audited_txn_count
        FROM public."DW_AUDITED_TXN" a
        WHERE a."PROCESS" = $1
        GROUP BY a."BRANCH_NAME"
      `;
      values = [process];

      // =========================
      // CEO
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          a."PROCESS",
          a."SUBPROCESS",
          COALESCE(SUM(a."AUDITED_TXN_COUNT"), 0) AS total_audited_txn_count
        FROM public."DW_AUDITED_TXN" a
        GROUP BY a."PROCESS", a."SUBPROCESS"
        ORDER BY a."PROCESS"
      `;
    }

    const result = await pool.query(query, values);

    res.json({
      total_audited_txn_count:
        result.rows[0]?.total_audited_txn_count || 0,

      data: result.rows,
    });

  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
};

// =====================================================
// Get Cash Collection By Branch Summary
// =====================================================
export const getCashDepositbyBranchSummaryByUser = async (
  req,
  res
) => {
  const {
    position,
    user_id,
    team,
    subprocess,
    process,
  } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COALESCE(
            SUM(a."TOTAL_CASH_CREDIT"),
            0
          ) AS total_cash_collection
        FROM public."DW_CASH_COLLECTION_BY_BRANCH" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;

      values = [user_id];

      // =========================
      // Manager
      // =========================
    } else if (position === "Manager") {
      query = `
        SELECT 
          COALESCE(
            SUM(a."TOTAL_CASH_CREDIT"),
            0
          ) AS total_cash_collection
        FROM public."DW_CASH_COLLECTION_BY_BRANCH" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;

      values = [user_id];

      // =========================
      // Director / Senior Director
      // =========================
    } else if (
      position === "Director" ||
      position === "Senior Director"
    ) {
      query = `
        SELECT 
          a."SUBPROCESS",
          COALESCE(
            SUM(a."TOTAL_CASH_CREDIT"),
            0
          ) AS total_cash_collection
        FROM public."DW_CASH_COLLECTION_BY_BRANCH" a
        WHERE a."SUBPROCESS" = $1
        GROUP BY a."SUBPROCESS"
      `;

      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          a."PROCESS",
          COALESCE(
            SUM(a."TOTAL_CASH_CREDIT"),
            0
          ) AS total_cash_collection
        FROM public."DW_CASH_COLLECTION_BY_BRANCH" a
        WHERE a."PROCESS" = $1
        GROUP BY a."PROCESS"
      `;

      values = [process];

      // =========================
      // CEO
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          a."PROCESS",
          a."SUBPROCESS",
          COALESCE(
            SUM(a."TOTAL_CASH_CREDIT"),
            0
          ) AS total_cash_collection
        FROM public."DW_CASH_COLLECTION_BY_BRANCH" a
        GROUP BY a."PROCESS", a."SUBPROCESS"
        ORDER BY a."PROCESS"
      `;
    } else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_cash_collection:
        result.rows[0]?.total_cash_collection || 0,

      data: result.rows,
    });

  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
};

export const getCRMCashDepositSummaryByUser = async (req, res) => {
  const { cbsusername, position, user_id, subprocess, process } =
    req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a."TOTAL_COLLECTED_CASH"), 0) AS total_crm_cash
        FROM public."DW_CASH_COLLECTION_BY_CRM" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // =========================
      // Manager
      // =========================
    } else if (position === "Manager") {
      query = `
        SELECT 
          COALESCE(SUM(a."TOTAL_COLLECTED_CASH"), 0) AS total_crm_cash
        FROM public."DW_CASH_COLLECTION_BY_CRM" a
        JOIN public.users u
          ON u.company_code = a."BRANCH_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      // =========================
      // Director
      // =========================
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          a."SUBPROCESS",
          COALESCE(SUM(a."TOTAL_COLLECTED_CASH"), 0) AS total_crm_cash
        FROM public."DW_CASH_COLLECTION_BY_CRM" a
        WHERE a."SUBPROCESS" = $1
        GROUP BY a."SUBPROCESS"
      `;
      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          a."BRANCH_NAME",
          COALESCE(SUM(a."TOTAL_COLLECTED_CASH"), 0) AS total_crm_cash
        FROM public."DW_CASH_COLLECTION_BY_CRM" a
        WHERE a."PROCESS" = $1
        GROUP BY a."BRANCH_NAME"
      `;
      values = [process];

      // =========================
      // CEO
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          a."PROCESS",
          a."SUBPROCESS",
          COALESCE(SUM(a."TOTAL_COLLECTED_CASH"), 0) AS total_crm_cash
        FROM public."DW_CASH_COLLECTION_BY_CRM" a
        GROUP BY a."PROCESS", a."SUBPROCESS"
        ORDER BY a."PROCESS"
      `;
    }

    const result = await pool.query(query, values);

    res.json({
      total_crm_cash:
        result.rows[0]?.total_crm_cash || 0,

      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
};



// =====================================================
// Get Actual Customer Engagement Summary
// =====================================================
export const getCustomerEngagementSummaryByUser = async (req, res) => {
  const {
    position,
    user_name,
    team,
    subprocess,
    process,
  } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COUNT(*) AS total_customer_engagement
        FROM public.engagement
        WHERE engagement_type = 'Customer Engagement'
          AND status = 'Approved'
          AND user_name = $1
      `;

      values = [user_name];

      // =========================
      // Manager
      // =========================
    } else if (position === "Manager") {
      query = `
        SELECT 
          team,
          COUNT(*) AS total_customer_engagement
        FROM public.engagement
        WHERE engagement_type = 'Customer Engagement'
          AND status = 'Approved'
          AND team = $1
        GROUP BY team
      `;

      values = [team];

      // =========================
      // Director / Senior Director
      // =========================
    } else if (
      position === "Director" ||
      position === "Senior Director"
    ) {
      query = `
        SELECT 
          subprocess,
          COUNT(*) AS total_customer_engagement
        FROM public.engagement
        WHERE engagement_type = 'Customer Engagement'
          AND status = 'Approved'
          AND subprocess = $1
        GROUP BY subprocess
      `;

      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          process,
          COUNT(*) AS total_customer_engagement
        FROM public.engagement
        WHERE engagement_type = 'Customer Engagement'
          AND status = 'Approved'
          AND process = $1
        GROUP BY process
      `;

      values = [process];

      // =========================
      // CEO
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          process,
          subprocess,
          COUNT(*) AS total_customer_engagement
        FROM public.engagement
        WHERE engagement_type = 'Customer Engagement'
          AND status = 'Approved'
        GROUP BY process, subprocess
        ORDER BY process
      `;
    } else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_customer_engagement:
        result.rows[0]?.total_customer_engagement || 0,

      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
};

// =====================================================
// Get Actual New Customer Onboarding Summary
// =====================================================
export const getNewCustomerOnboardingSummaryByUser = async (
  req,
  res
) => {
  const {
    position,
    user_name,
    team,
    subprocess,
    process,
  } = req.body;

  try {
    let query = "";
    let values = [];

    // =========================
    // CRM / Individual
    // =========================
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = `
        SELECT 
          COUNT(*) AS total_new_customer_onboarding
        FROM public.engagement
        WHERE engagement_type = 'New Customer Onboarding'
          AND status = 'Approved'
          AND user_name = $1
      `;

      values = [user_name];

      // =========================
      // Manager
      // =========================
    } else if (position === "Manager") {
      query = `
        SELECT 
          team,
          COUNT(*) AS total_new_customer_onboarding
        FROM public.engagement
        WHERE engagement_type = 'New Customer Onboarding'
          AND status = 'Approved'
          AND team = $1
        GROUP BY team
      `;

      values = [team];

      // =========================
      // Director / Senior Director
      // =========================
    } else if (
      position === "Director" ||
      position === "Senior Director"
    ) {
      query = `
        SELECT 
          subprocess,
          COUNT(*) AS total_new_customer_onboarding
        FROM public.engagement
        WHERE engagement_type = 'New Customer Onboarding'
          AND status = 'Approved'
          AND subprocess = $1
        GROUP BY subprocess
      `;

      values = [subprocess];

      // =========================
      // VP / CHF
      // =========================
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          process,
          COUNT(*) AS total_new_customer_onboarding
        FROM public.engagement
        WHERE engagement_type = 'New Customer Onboarding'
          AND status = 'Approved'
          AND process = $1
        GROUP BY process
      `;

      values = [process];

      // =========================
      // CEO
      // =========================
    } else if (position === "CEO") {
      query = `
        SELECT 
          process,
          subprocess,
          COUNT(*) AS total_new_customer_onboarding
        FROM public.engagement
        WHERE engagement_type = 'New Customer Onboarding'
          AND status = 'Approved'
        GROUP BY process, subprocess
        ORDER BY process
      `;
    } else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_new_customer_onboarding:
        result.rows[0]?.total_new_customer_onboarding || 0,

      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
};

// =====================================================
// Get CSO Transaction Performance
// =====================================================
export const getCsoTransactionPerformance = async (req, res) => {
  const { cbsusername } = req.body;

  try {
    const query = `
      SELECT "USER_ID", "USER_NAME", "EMPLOYEE_NAME", "DISTRICT_NAME", "BRANCH_NAME", "BRANCH", "BRANCH_TOTAL_TXN", "NO_OF_STAFF", "AVERAGE_TXN_PLAN", "TRANSACTION_DONE_PER_CSO", "ACCOMPLISHMENT_PERCENTAGE"
      FROM public."DW_CSO_TRANSACTION_PERFORMANCE"
      WHERE "USER_ID" = $1
    `;
    const values = [cbsusername];

    const result = await pool.query(query, values);

    res.status(200).json({
      data: result.rows,
      total_accomplishment_percentage: result.rows[0]?.ACCOMPLISHMENT_PERCENTAGE || 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// Get Branch Internal Accounts Summary
// =====================================================
export const getBranchInternalAccountsSummary = async (req, res) => {
  const { company_code } = req.body;

  try {
    const query = `
      SELECT "0502", "0730", "0751", "0771", "0792", "0794", "0802", "0804", "0819", "0820", "0825", "0831", "0845", "0850", "4405", "4410", "4425", "4435", "4440", "4445", "4475", "4485", "4523", "4605", "4616", "4625", "4630", "4636", "4685", "4687", "4689", "4694", "4840", "4866", "4882", "4885", "4887", "4888"
      FROM public."DW_BRANCH_INTERNAL_ACCOUNTS"
      WHERE "BRANCH_CODE" = $1
      LIMIT 1
    `;
    const values = [company_code];

    const result = await pool.query(query, values);

    let finalValue = 0;

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const columns = [
        "0502", "0730", "0751", "0771", "0792", "0794", "0802", "0804",
        "0819", "0820", "0825", "0831", "0845", "0850", "4405", "4410",
        "4425", "4435", "4440", "4445", "4475", "4485", "4523", "4605",
        "4616", "4625", "4630", "4636", "4685", "4687", "4689", "4694",
        "4840", "4866", "4882", "4885", "4887", "4888"
      ];

      let all100 = true;
      for (const col of columns) {
        if (Number(row[col]) !== 100) {
          all100 = false;
          break;
        }
      }

      finalValue = all100 ? 100 : 0;
    }

    res.status(200).json({
      internal_account_value: finalValue,
      data: result.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
