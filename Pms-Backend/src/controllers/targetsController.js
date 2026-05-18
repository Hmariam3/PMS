import pool from "../db.js";

// Get all targets
export const getAllTargets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM public.targets
       ORDER BY target_id`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single target by ID
export const getTargetById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
       FROM public.targets
       WHERE target_id = $1`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Target not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new target
export const createTarget = async (req, res) => {
  const {
    user_name,
    deposit_target,
    fcy_target,
    loan_collection,
    process,
    subprocess,
    team,
    cash_collection,
    cash_deposited_crm,
    created_by,
    approved_by,
  } = req.body;

  if (!user_name) {
    return res.status(400).json({ message: "user_name is required" });
  }

  try {
    const check = await pool.query(
      `SELECT 1 FROM public.targets WHERE user_name = $1 LIMIT 1`,
      [user_name],
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ message: "Target already registered" });
    }

    const result = await pool.query(
      `INSERT INTO public.targets (
        user_name,
        deposit_target,
        fcy_target,
        loan_collection,
        process,
        subprocess,
        team,
        cash_collection,
        cash_deposited_crm,
        created_by,
        approved_by,
        created_at,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),'Pending')
      RETURNING *`,
      [
        user_name,
        deposit_target || 0,
        fcy_target || 0,
        loan_collection || 0,
        process || null,
        subprocess || null,
        team || null,
        cash_collection || 0,
        cash_deposited_crm || 0,
        created_by || null,
        approved_by || null,
      ],
    );

    res.status(201).json({
      message: "Target created",
      target: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update a target
export const updateTarget = async (req, res) => {
  const { id } = req.params;

  const {
    user_name,
    deposit_target,
    fcy_target,
    loan_collection,
    process,
    subprocess,
    team,
    cash_collection,
    cash_deposited_crm,
    created_by,
    approved_by,
    status,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.targets
       SET 
        user_name = $1,
        deposit_target = $2,
        fcy_target = $3,
        loan_collection = $4,
        process = $5,
        subprocess = $6,
        team = $7,
        cash_collection = $8,
        cash_deposited_crm = $9,
        created_by = $10,
        approved_by = $11,
        status = $12
       WHERE target_id = $13
       RETURNING *`,
      [
        user_name,
        deposit_target || 0,
        fcy_target || 0,
        loan_collection || 0,
        process || null,
        subprocess || null,
        team || null,
        cash_collection || 0,
        cash_deposited_crm || 0,
        created_by || null,
        approved_by || null,
        status || "Pending",
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Target not found" });
    }

    res.status(200).json({
      message: "Target updated",
      target: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Approve target
export const approveTarget = async (req, res) => {
  const { id } = req.params;

  const { approved_by, approved_at, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.targets
       SET
        approved_by = $1,
        approved_at = $2,
        status = $3
       WHERE target_id = $4
       RETURNING *`,
      [
        approved_by || null,
        approved_at || new Date(),
        status || "Approved",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Target not found",
      });
    }

    res.status(200).json({
      message: "Target approved successfully",
      target: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

// Delete a target
export const deleteTarget = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.targets
       WHERE target_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Target not found" });

    res.status(200).json({ message: "Target deleted", target: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getTargetByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT *
        FROM public.targets
        WHERE user_name = $1
        ORDER BY target_id
      `;
      values = [user_id];
    } else if (position === "Manager") {
      query = `
        SELECT *
        FROM public.targets
        WHERE team = $1
        ORDER BY target_id
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT *
        FROM public.targets
        WHERE subprocess = $1
        ORDER BY target_id
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT *
        FROM public.targets
        WHERE process = $1
        ORDER BY target_id
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT *
        FROM public.targets
        ORDER BY target_id
      `;
      values = [];
    }

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getTargetsSummaryByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;



  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values;

    const baseQuery = `
      SELECT 
        SUM(COALESCE(deposit_target, 0)) AS total_deposit,
        SUM(COALESCE(fcy_target, 0)) AS total_fcy,
        SUM(COALESCE(loan_collection, 0)) AS total_loan,

        SUM(COALESCE(cash_collection, 0)) AS total_cash_collection,
        SUM(COALESCE(cash_deposited_crm, 0)) AS cash_deposited_crm,

        SUM(
          COALESCE(deposit_target, 0) +
          COALESCE(fcy_target, 0) +
          COALESCE(loan_collection, 0) +
          COALESCE(cash_collection, 0) +
          COALESCE(cash_deposited_crm, 0)
        ) AS grand_total

      FROM public.targets
    `;

    // CRM / Individual
    if (position === "CRM" || position === "Individual") {

      query = baseQuery + `
        WHERE user_name = $1
        AND status = 'Approved'
      `;

      values = [user_id];

    }

    // Manager
    else if (position === "Manager") {

      query = baseQuery + `
        WHERE team = $1
        AND status = 'Approved'
      `;

      values = [team];

    }

    // Director / Senior Director
    else if (
      position === "Director" ||
      position === "Senior Director"
    ) {

      query = baseQuery + `
        WHERE subprocess = $1
        AND status = 'Approved'
      `;

      values = [subprocess];
    }

    // VP / CHF
    else if (position === "VP" || position === "CHF") {

      query = baseQuery + `
        WHERE process = $1
        AND status = 'Approved'
      `;

      values = [process];

    }

    // CEO
    else if (position === "CEO") {

      query = baseQuery + `
        WHERE status = 'Approved'
      `;

      values = [];

    }

    else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    const row = result.rows[0];

    // if no approved records found
    if (
      !row ||
      (
        Number(row.total_deposit || 0) === 0 &&
        Number(row.total_fcy || 0) === 0 &&
        Number(row.total_loan || 0) === 0 &&
        Number(row.total_cash_collection || 0) === 0 &&
        Number(row.cash_deposited_crm || 0) === 0
      )
    ) {
      return res.status(404).json({
        message: "No approved targets found",
      });
    }

    res.status(200).json({
      total_deposit: row.total_deposit || 0,
      total_fcy: row.total_fcy || 0,
      total_loan: row.total_loan || 0,

      cash_collection: row.total_cash_collection || 0,
      cash_deposited_crm: row.cash_deposited_crm || 0,

      grand_total: row.grand_total || 0,
    });

  } catch (err) {

    console.error(err.message);

    res.status(500).json({
      error: "Server error",
    });

  }
};
