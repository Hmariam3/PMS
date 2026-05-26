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
    is_shared,
    shared_with,
    shared_amount_1,
    shared_amount_2,
  } = req.body;

  try {
    // Check for duplicate reference
    if (reference) {
      const dupCheck = await pool.query(
        "SELECT fcy_id FROM public.fcydeposit WHERE reference = $1",
        [reference]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ message: `Reference '${reference}' already exists. Duplicate references are not allowed.` });
      }
    }

    if (is_shared) {
      const numAmount = Number(amount) || 0;
      if (numAmount <= 0) {
        return res.status(400).json({ message: "Sharing is only allowed for amounts greater than 0" });
      }
      const sumShares = (Number(shared_amount_1) || 0) + (Number(shared_amount_2) || 0);
      if (sumShares > numAmount) {
        return res.status(400).json({ message: "Sum of shared amounts cannot exceed total amount" });
      }
      if (!shared_with) {
        return res.status(400).json({ message: "Second user for sharing is required" });
      }

      // Fetch shared user's details
      const sharedUserRes = await pool.query(
        "SELECT process, subprocess, team, full_name FROM public.users WHERE user_name = $1",
        [shared_with]
      );
      if (sharedUserRes.rows.length === 0) {
        return res.status(404).json({ message: `Shared user '${shared_with}' not found` });
      }
      const sUser = sharedUserRes.rows[0];

      // Insert Row 1: Logged user
      const result1 = await pool.query(
        `INSERT INTO public.fcydeposit 
         (account_number, account_holder, amount, reference, user_name, created_at, process, subprocess, team, crm_name, status, createdby, is_shared)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, TRUE)
         RETURNING *`,
        [
          account_number,
          account_holder,
          shared_amount_1 || 0,
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

      // Insert Row 2: Shared user
      const result2 = await pool.query(
        `INSERT INTO public.fcydeposit 
         (account_number, account_holder, amount, reference, user_name, created_at, process, subprocess, team, crm_name, status, createdby, is_shared)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, TRUE)
         RETURNING *`,
        [
          account_number,
          account_holder,
          shared_amount_2 || 0,
          reference,
          shared_with,
          sUser.process,
          sUser.subprocess,
          sUser.team,
          sUser.full_name,
          status || 'Pending',
          createdby || user_name,
        ],
      );

      return res.status(201).json({
        message: "FCY deposits created and shared successfully",
        deposits: [result1.rows[0], result2.rows[0]],
      });
    } else {
      // Normal flow: Single row insertion
      const result = await pool.query(
        `INSERT INTO public.fcydeposit 
         (account_number, account_holder, amount, reference, user_name, created_at, process, subprocess, team, crm_name, status, createdby, is_shared)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, FALSE)
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

      return res.status(201).json({
        message: "FCY deposit created",
        deposit: result.rows[0],
      });
    }
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
    is_shared,
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
           approvedby = $11,
           is_shared = $12
       WHERE fcy_id = $13
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
        is_shared || false,
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
