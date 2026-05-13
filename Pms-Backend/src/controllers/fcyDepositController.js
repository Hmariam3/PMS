import pool from "../db.js";

// ✅ Get all FCY deposits
export const getAllFcyDeposits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.fcydeposit ORDER BY fcy_id`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get FCY deposits by user context
export const getFcyDepositsByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `SELECT * FROM public.fcydeposit WHERE user_name = $1 ORDER BY fcy_id`;
      values = [user_id];
    } else if (position === "Manager") {
      query = `SELECT * FROM public.fcydeposit WHERE team = $1 ORDER BY fcy_id`;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `SELECT * FROM public.fcydeposit WHERE subprocess = $1 ORDER BY fcy_id`;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `SELECT * FROM public.fcydeposit WHERE process = $1 ORDER BY fcy_id`;
      values = [process];
    } else if (position === "CEO") {
      query = `SELECT * FROM public.fcydeposit ORDER BY fcy_id`;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create new FCY deposit
export const createFcyDeposit = async (req, res) => {
  const {
    account_number,
    account_holder,
    amount,
    reference,
    user_name,
    process,
    subprocess,
    team,
    crm_name,
    status,
    createdby,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.fcydeposit 
       (account_number, account_holder, amount, reference, user_name, created_at, process, subprocess, team, crm_name, status, createdby)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        account_number,
        account_holder,
        amount || 0,
        reference,
        user_name,
        process,
        subprocess,
        team,
        crm_name,
        status || 'Pending',
        createdby || user_name,
      ],
    );

    res.status(201).json({
      message: "FCY deposit created",
      deposit: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update FCY deposit
export const updateFcyDeposit = async (req, res) => {
  const { id } = req.params;
  const {
    account_number,
    account_holder,
    amount,
    reference,
    user_name,
    process,
    subprocess,
    team,
    crm_name,
    status,
    approvedby,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.fcydeposit
       SET account_number = $1,
           account_holder = $2,
           amount = $3,
           reference = $4,
           user_name = $5,
           process = $6,
           subprocess = $7,
           team = $8,
           crm_name = $9,
           status = $10,
           approvedby = $11
       WHERE fcy_id = $12
       RETURNING *`,
      [
        account_number,
        account_holder,
        amount,
        reference,
        user_name,
        process,
        subprocess,
        team,
        crm_name,
        status,
        approvedby,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "FCY deposit not found" });
    }

    res.status(200).json({
      message: "FCY deposit updated",
      deposit: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// approve fcy deposit
export const approveFcyDeposit = async (req, res) => {
  const { id } = req.params;
  const { approvedby } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.fcydeposit
       SET status = 'Approved',
           approvedby = $1
       WHERE fcy_id = $2
       RETURNING *`,
      [approvedby, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "FCY deposit not found" });
    }

    res.status(200).json({
      message: "FCY deposit approved",
      deposit: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// Delete FCY deposit
export const deleteFcyDeposit = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.fcydeposit WHERE fcy_id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "FCY deposit not found" });
    }

    res.status(200).json({
      message: "FCY deposit deleted",
      deposit: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
