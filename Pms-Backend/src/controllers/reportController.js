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
