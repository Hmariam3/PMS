import pool from "../db.js";

// Get all
// =========================
// GET ALL
// =========================
export const getAllNonDepositTargets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        target_id, user_name, new_account, unauthorized_transaction, created_at, 
        process, subprocess, team, active_card_no, eeu_transaction_count, 
        merchant_recruitment, merchant_transaction_volume, agent_recruitment, 
        agent_transaction_volume, michu_unique_recruitment, digital_transaction_volume, 
        coopay_ebirr_activation, atm_crm_uptime_rate, created_by, approved_by, 
        approved_at, status, cash_balance_accuracy_rate, pos_deployment, 
        avg_txn_per_cso, compliance_rate, reports_3days_rate, audit_report_quality, 
        cash_surprise_checks, employee_perf_threshold, transaction_audit_rate,
        customer_engagement,
        new_customer_onboarding,
        armingc_deposit_proportion,
        gl,
      FROM public.non_deposit_target
      ORDER BY target_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// =========================
// GET BY ID
// =========================
export const getNonDepositTargetById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        target_id, user_name, new_account, unauthorized_transaction, created_at, 
        process, subprocess, team, active_card_no, eeu_transaction_count, 
        merchant_recruitment, merchant_transaction_volume, agent_recruitment, 
        agent_transaction_volume, michu_unique_recruitment, digital_transaction_volume, 
        coopay_ebirr_activation, atm_crm_uptime_rate, created_by, approved_by, 
        approved_at, status, cash_balance_accuracy_rate, pos_deployment, 
        avg_txn_per_cso, compliance_rate, reports_3days_rate, audit_report_quality, 
        cash_surprise_checks, employee_perf_threshold, transaction_audit_rate,
        customer_engagement,
        new_customer_onboarding,
        armingc_deposit_proportion,
        gl,
      FROM public.non_deposit_target
      WHERE target_id = $1`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// =========================
// CREATE
// =========================
export const createNonDepositTarget = async (req, res) => {
  const {
    user_name,
    new_account,
    unauthorized_transaction,
    active_card_no,
    eeu_transaction_count,

    merchant_recruitment,
    merchant_transaction_volume,
    agent_recruitment,
    agent_transaction_volume,
    michu_unique_recruitment,
    digital_transaction_volume,
    coopay_ebirr_activation,
    atm_crm_uptime_rate,

    cash_balance_accuracy_rate,
    pos_deployment,
    avg_txn_per_cso,
    compliance_rate,
    reports_3days_rate,
    audit_report_quality,
    cash_surprise_checks,
    employee_perf_threshold,
    transaction_audit_rate,
    customer_engagement,
    new_customer_onboarding,
    armingc_deposit_proportion,
    gl,

    process,
    subprocess,
    team,
    created_by,
  } = req.body;

  if (!user_name) {
    return res.status(400).json({ message: "user_name required" });
  }

  try {
    const check = await pool.query(
      `SELECT 1 FROM public.non_deposit_target WHERE user_name = $1`,
      [user_name],
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ message: "Already exists" });
    }

    const result = await pool.query(
      `INSERT INTO public.non_deposit_target (
        user_name,
        new_account,
        unauthorized_transaction,
        active_card_no,
        eeu_transaction_count,

        merchant_recruitment,
        merchant_transaction_volume,
        agent_recruitment,
        agent_transaction_volume,
        michu_unique_recruitment,
        digital_transaction_volume,
        coopay_ebirr_activation,
        atm_crm_uptime_rate,

        cash_balance_accuracy_rate,
        pos_deployment,
        avg_txn_per_cso,
        compliance_rate,
        reports_3days_rate,
        audit_report_quality,
        cash_surprise_checks,
        employee_perf_threshold,
        transaction_audit_rate,
        customer_engagement,
        new_customer_onboarding,
        armingc_deposit_proportion,
        gl,

        process,
        subprocess,
        team,
        created_by,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21,$22,
        $23,$24,$25,$26,$27,$28,$29,$30,$31
      )
      RETURNING *`,
      [
        user_name,
        new_account || 0,
        unauthorized_transaction || 0,
        active_card_no || 0,
        eeu_transaction_count || 0,

        merchant_recruitment || 0,
        merchant_transaction_volume || 0,
        agent_recruitment || 0,
        agent_transaction_volume || 0,
        michu_unique_recruitment || 0,
        digital_transaction_volume || 0,
        coopay_ebirr_activation || 0,
        atm_crm_uptime_rate || 0,

        cash_balance_accuracy_rate || 0,
        pos_deployment || 0,
        avg_txn_per_cso || 0,
        compliance_rate || 0,
        reports_3days_rate || 0,
        audit_report_quality || 0,
        cash_surprise_checks || 0,
        employee_perf_threshold || 0,
        transaction_audit_rate || 0,
        customer_engagement || 0,
        new_customer_onboarding || 0,
        armingc_deposit_proportion || 0,
        gl || 0,

        process || null,
        subprocess || null,
        team || null,
        created_by || null,
        "Pending",
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// UPDATE
// =========================
export const updateNonDepositTarget = async (req, res) => {
  const { id } = req.params;

  const {
    user_name,
    new_account,
    unauthorized_transaction,
    active_card_no,
    eeu_transaction_count,

    merchant_recruitment,
    merchant_transaction_volume,
    agent_recruitment,
    agent_transaction_volume,
    michu_unique_recruitment,
    digital_transaction_volume,
    coopay_ebirr_activation,
    atm_crm_uptime_rate,

    cash_balance_accuracy_rate,
    pos_deployment,
    avg_txn_per_cso,
    compliance_rate,
    reports_3days_rate,
    audit_report_quality,
    cash_surprise_checks,
    employee_perf_threshold,
    transaction_audit_rate,
    customer_engagement,
    new_customer_onboarding,
    armingc_deposit_proportion,
    gl,

    process,
    subprocess,
    team,
    status,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.non_deposit_target
       SET 
        user_name = $1,
        new_account = $2,
        unauthorized_transaction = $3,
        active_card_no = $4,
        eeu_transaction_count = $5,

        merchant_recruitment = $6,
        merchant_transaction_volume = $7,
        agent_recruitment = $8,
        agent_transaction_volume = $9,
        michu_unique_recruitment = $10,
        digital_transaction_volume = $11,
        coopay_ebirr_activation = $12,
        atm_crm_uptime_rate = $13,

        cash_balance_accuracy_rate = $14,
        pos_deployment = $15,
        avg_txn_per_cso = $16,
        compliance_rate = $17,
        reports_3days_rate = $18,
        audit_report_quality = $19,
        cash_surprise_checks = $20,
        employee_perf_threshold = $21,
        transaction_audit_rate = $22,
        customer_engagement = $23,
        new_customer_onboarding = $24,
        armingc_deposit_proportion = $25,
        gl = $26,

        process = $27,
        subprocess = $28,
        team = $29,
        status = $30

       WHERE target_id = $31
       RETURNING *`,
      [
        user_name,
        new_account || 0,
        unauthorized_transaction || 0,
        active_card_no || 0,
        eeu_transaction_count || 0,

        merchant_recruitment || 0,
        merchant_transaction_volume || 0,
        agent_recruitment || 0,
        agent_transaction_volume || 0,
        michu_unique_recruitment || 0,
        digital_transaction_volume || 0,
        coopay_ebirr_activation || 0,
        atm_crm_uptime_rate || 0,

        cash_balance_accuracy_rate || 0,
        pos_deployment || 0,
        avg_txn_per_cso || 0,
        compliance_rate || 0,
        reports_3days_rate || 0,
        audit_report_quality || 0,
        cash_surprise_checks || 0,
        employee_perf_threshold || 0,
        transaction_audit_rate || 0,
        customer_engagement || 0,
        new_customer_onboarding || 0,
        armingc_deposit_proportion || 0,
        gl || 0,

        process || null,
        subprocess || null,
        team || null,
        status || "Pending",

        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// =========================
// DELETE
// =========================
export const deleteNonDepositTarget = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.non_deposit_target WHERE target_id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Role-based fetch
export const getNonDepositTargetByUser = async (req, res) => {
  const { user_id, position, supervisor, team, subprocess, process } = req.body;

  try {
    let query = "";
    let values = [];

    if (position === "CRM" || position === "Individual" || position === "Area Manager") {

      query = `
      SELECT * 
      FROM public.non_deposit_target 
      WHERE user_name = $1
      ORDER BY target_id
    `;

      values = [user_id];

    } else if (position === "Manager") {

      query = `
          SELECT ndt.*
          FROM public.non_deposit_target ndt
          INNER JOIN public.users u
              ON ndt.user_name = u.user_name
          INNER JOIN public.employees e
              ON u.mail_address = e.outlook_address
          WHERE
              u.user_name = $1
              OR (
                  u.team = $2
                  AND e.supervisor = $3
              )
          ORDER BY ndt.target_id;
    `;

      values = [user_id, team, supervisor];

    } else if (position === "Director" || position === "Senior Director") {

      query = `
      SELECT ndt.*
      FROM public.non_deposit_target ndt
      INNER JOIN public.users u
          ON ndt.user_name = u.user_name
      INNER JOIN public.employees e
          ON u.mail_address = e.outlook_address
      WHERE
          u.user_name = $1
          OR (
              u.subprocess = $2
              AND e.supervisor = $3
          )
      ORDER BY ndt.target_id
    `;

      values = [user_id, subprocess, supervisor];

    } else if (position === "VP" || position === "CHF") {

      query = `
  SELECT ndt.*
  FROM public.non_deposit_target ndt
  INNER JOIN public.users u
      ON ndt.user_name = u.user_name
  INNER JOIN public.employees e
      ON u.mail_address = e.outlook_address
  WHERE
      u.user_name = $1
      OR (
          u.process = $2
          AND e.supervisor = $3
      )
  ORDER BY ndt.target_id
    `;


      values = [user_id, process, supervisor];


    } else if (position === "CEO") {

      query = `
  SELECT ndt.*
  FROM public.non_deposit_target ndt
  INNER JOIN public.users u
      ON ndt.user_name = u.user_name
  INNER JOIN public.employees e
      ON u.mail_address = e.outlook_address
  WHERE
      u.user_name = $1
      OR e.supervisor = $2
  ORDER BY ndt.target_id
    `;

      values = [user_id, supervisor];

    } else {

      query = `
      SELECT * 
      FROM public.non_deposit_target
      ORDER BY target_id
    `;
    }

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveTarget = async (req, res) => {
  const { id } = req.params;

  const { approved_by, approved_at, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.non_deposit_target
       SET 
        approved_by = $1,
        approved_at = $2,
        status = $3

       WHERE target_id = $4
       RETURNING *`,
      [
        approved_by || null,
        approved_at || null,
        status || "Pending",

        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Summary
export const getNonDepositSummaryByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;


  try {
    let query = "";
    let values = [];

    const baseQuery = `
      SELECT 
        SUM(new_account) AS total_new_account,
        SUM(unauthorized_transaction) AS total_unauthorized,
        SUM(active_card_no) AS active_card,

        SUM(merchant_recruitment) AS merchant_recruitment,
        SUM(merchant_transaction_volume) AS merchant_transaction_volume,
        SUM(agent_recruitment) AS agent_recruitment,
        SUM(agent_transaction_volume) AS agent_transaction_volume,
        SUM(michu_unique_recruitment) AS michu_unique_recruitment,
        SUM(coopay_ebirr_activation) AS coopay_ebirr_activation,


        SUM(cash_balance_accuracy_rate) AS cash_balance_accuracy_rate,
        SUM(pos_deployment) AS pos_deployment,
        SUM(avg_txn_per_cso) AS avg_txn_per_cso,
        SUM(compliance_rate) AS compliance_rate,
        SUM(reports_3days_rate) AS reports_3days_rate,
        SUM(audit_report_quality) AS audit_report_quality,
        SUM(cash_surprise_checks) AS cash_surprise_checks,
        SUM(transaction_audit_rate) AS transaction_audit_rate,

        SUM(customer_engagement) AS customer_engagement,
        SUM(new_customer_onboarding) AS new_customer_onboarding,
        SUM(armingc_deposit_proportion) AS armingc_deposit_proportion,
        SUM(gl) AS gl

      FROM public.non_deposit_target where status = 'Approved'
    `;

    if (position === "CRM" || position === "Individual" || position === "Area Manager") {
      query = baseQuery + ` AND user_name = $1`;

      values = [user_id];
    } else if (position === "Manager") {
      query = baseQuery + ` AND user_name = $1`;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director") {
      query = baseQuery + ` AND user_name = $1`;
      values = [user_id];
    } else if (position === "VP" || position === "CHF") {
      query = baseQuery + ` AND user_name = $1`;
      values = [user_id];
    } else if (position === "CEO") {
      query = baseQuery + ` AND user_name = $1`;
      values = [user_id];
    }

    const result = await pool.query(query, values);

    const row = result.rows[0];

    res.json({
      total_new_account: row.total_new_account || 0,
      total_unauthorized: row.total_unauthorized || 0,
      active_card: row.active_card || 0,
      merchant_recruitment: row.merchant_recruitment || 0,
      merchant_transaction_volume: row.merchant_transaction_volume || 0,
      agent_recruitment: row.agent_recruitment || 0,
      agent_transaction_volume: row.agent_transaction_volume || 0,
      michu_unique_recruitment: row.michu_unique_recruitment || 0,
      coopay_ebirr_activation: row.coopay_ebirr_activation || 0,
      cash_balance_accuracy_rate: row.cash_balance_accuracy_rate || 0,
      pos_deployment: row.pos_deployment || 0,
      avg_txn_per_cso: row.avg_txn_per_cso || 0,
      compliance_rate: row.compliance_rate || 0,
      reports_3days_rate: row.reports_3days_rate || 0,
      audit_report_quality: row.audit_report_quality || 0,
      cash_surprise_checks: row.cash_surprise_checks || 0,
      transaction_audit_rate: row.transaction_audit_rate || 0,
      customer_engagement: row.customer_engagement || 0,
      new_customer_onboarding: row.new_customer_onboarding || 0,
      armingc_deposit_proportion: row.armingc_deposit_proportion || 0,
      gl: row.gl || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getNonDepositATMEEUDigitalByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values = [];

    // CRM / Individual
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {

      query = `
        SELECT
          COALESCE(eeu_transaction_count,0) AS eeu_transaction,
          COALESCE(digital_transaction_volume,0) AS digital_transaction_volume,
          COALESCE(atm_crm_uptime_rate,0) AS atm_crm_uptime_rate,
          COALESCE(employee_perf_threshold,0) AS employee_perf_threshold
        FROM public.non_deposit_target
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    // Manager
    else if (position === "Manager") {
      // query = `
      //   SELECT

      //     (
      //       SELECT COALESCE(eeu_transaction_count,0)
      //       FROM public.non_deposit_target
      //       WHERE team = $1
      //         AND status='Approved'
      //         AND eeu_transaction_count > 0
      //       ORDER BY created_at
      //       LIMIT 1
      //     ) AS eeu_transaction,

      //     (
      //       SELECT COALESCE(digital_transaction_volume,0)
      //       FROM public.non_deposit_target
      //       WHERE team = $1
      //         AND status='Approved'
      //         AND digital_transaction_volume > 0
      //       ORDER BY created_at
      //       LIMIT 1
      //     ) AS digital_transaction_volume,

      //     (
      //       SELECT COALESCE(atm_crm_uptime_rate,0)
      //       FROM public.non_deposit_target
      //       WHERE team = $1
      //         AND status='Approved'
      //         AND atm_crm_uptime_rate > 0
      //       ORDER BY created_at
      //       LIMIT 1
      //     ) AS atm_crm_uptime_rate,

      //     (
      //       SELECT COALESCE(employee_perf_threshold,0)
      //       FROM public.non_deposit_target
      //       WHERE team = $1
      //         AND status='Approved'
      //         AND employee_perf_threshold > 0
      //       ORDER BY created_at
      //       LIMIT 1
      //     ) AS employee_perf_threshold

      // `;

      // values = [team];
      query = `
        SELECT
          COALESCE(eeu_transaction_count,0) AS eeu_transaction,
          COALESCE(digital_transaction_volume,0) AS digital_transaction_volume,
          COALESCE(atm_crm_uptime_rate,0) AS atm_crm_uptime_rate,
          COALESCE(employee_perf_threshold,0) AS employee_perf_threshold
        FROM public.non_deposit_target
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    // Director / Senior Director
    else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT
          COALESCE(eeu_transaction_count,0) AS eeu_transaction,
          COALESCE(digital_transaction_volume,0) AS digital_transaction_volume,
          COALESCE(atm_crm_uptime_rate,0) AS atm_crm_uptime_rate,
          COALESCE(employee_perf_threshold,0) AS employee_perf_threshold
        FROM public.non_deposit_target
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
      // query = `
      //   SELECT

      //     (
      //       SELECT COALESCE(SUM(eeu_transaction_count),0)
      //       FROM (
      //         SELECT DISTINCT ON (team)
      //           team,
      //           eeu_transaction_count
      //         FROM public.non_deposit_target
      //         WHERE subprocess = $1
      //           AND status='Approved'
      //           AND eeu_transaction_count > 0
      //         ORDER BY team, created_at
      //       ) x
      //     ) AS eeu_transaction,

      //     (
      //       SELECT COALESCE(SUM(digital_transaction_volume),0)
      //       FROM (
      //         SELECT DISTINCT ON (team)
      //           team,
      //           digital_transaction_volume
      //         FROM public.non_deposit_target
      //         WHERE subprocess = $1
      //           AND status='Approved'
      //           AND digital_transaction_volume > 0
      //         ORDER BY team, created_at
      //       ) x
      //     ) AS digital_transaction_volume,

      //     (
      //       SELECT COALESCE(SUM(atm_crm_uptime_rate),0)
      //       FROM (
      //         SELECT DISTINCT ON (team)
      //           team,
      //           atm_crm_uptime_rate
      //         FROM public.non_deposit_target
      //         WHERE subprocess = $1
      //           AND status='Approved'
      //           AND atm_crm_uptime_rate > 0
      //         ORDER BY team, created_at
      //       ) x
      //     ) AS atm_crm_uptime_rate,

      //     (
      //       SELECT COALESCE(SUM(employee_perf_threshold),0)
      //       FROM (
      //         SELECT DISTINCT ON (team)
      //           team,
      //           employee_perf_threshold
      //         FROM public.non_deposit_target
      //         WHERE subprocess = $1
      //           AND status='Approved'
      //           AND employee_perf_threshold > 0
      //         ORDER BY team, created_at
      //       ) x
      //     ) AS employee_perf_threshold
      // `;

      // values = [subprocess];
    }

    // VP / CHF
    else if (position === "VP" || position === "CHF") {

      query = `
        SELECT

          (
            SELECT COALESCE(SUM(eeu_transaction_count),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                eeu_transaction_count
              FROM public.non_deposit_target
              WHERE process = $1
                AND status='Approved'
                AND eeu_transaction_count > 0
              ORDER BY team, created_at
            ) x
          ) AS eeu_transaction,

          (
            SELECT COALESCE(SUM(digital_transaction_volume),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                digital_transaction_volume
              FROM public.non_deposit_target
              WHERE process = $1
                AND status='Approved'
                AND digital_transaction_volume > 0
              ORDER BY team, created_at
            ) x
          ) AS digital_transaction_volume,

          (
            SELECT COALESCE(SUM(atm_crm_uptime_rate),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                atm_crm_uptime_rate
              FROM public.non_deposit_target
              WHERE process = $1
                AND status='Approved'
                AND atm_crm_uptime_rate > 0
              ORDER BY team, created_at
            ) x
          ) AS atm_crm_uptime_rate, 

          (
            SELECT COALESCE(SUM(employee_perf_threshold),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                employee_perf_threshold
              FROM public.non_deposit_target
              WHERE process = $1
                AND status='Approved'
                AND employee_perf_threshold > 0
              ORDER BY team, created_at
            ) x
          ) AS employee_perf_threshold
      `;

      values = [process];
    }

    // CEO
    else if (position === "CEO") {

      query = `
        SELECT

          (
            SELECT COALESCE(SUM(eeu_transaction_count),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                eeu_transaction_count
              FROM public.non_deposit_target
              WHERE status='Approved'
                AND eeu_transaction_count > 0
              ORDER BY team, created_at
            ) x
          ) AS eeu_transaction,

          (
            SELECT COALESCE(SUM(digital_transaction_volume),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                digital_transaction_volume
              FROM public.non_deposit_target
              WHERE status='Approved'
                AND digital_transaction_volume > 0
              ORDER BY team, created_at
            ) x
          ) AS digital_transaction_volume,

          (
            SELECT COALESCE(SUM(atm_crm_uptime_rate),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                atm_crm_uptime_rate
              FROM public.non_deposit_target
              WHERE status='Approved'
                AND atm_crm_uptime_rate > 0
              ORDER BY team, created_at
            ) x
          ) AS atm_crm_uptime_rate,

          (
            SELECT COALESCE(SUM(employee_perf_threshold),0)
            FROM (
              SELECT DISTINCT ON (team)
                team,
                employee_perf_threshold
              FROM public.non_deposit_target
              WHERE status='Approved'
                AND employee_perf_threshold > 0
              ORDER BY team, created_at
            ) x
          ) AS employee_perf_threshold
      `;
    }

    else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    const row = result.rows[0] || {};

    return res.status(200).json({
      eeu_transaction: Number(row.eeu_transaction || 0),
      digital_transaction_volume: Number(row.digital_transaction_volume || 0),
      atm_crm_uptime_rate: Number(row.atm_crm_uptime_rate || 0),
      employee_perf_threshold: Number(row.employee_perf_threshold || 0)
    });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
};