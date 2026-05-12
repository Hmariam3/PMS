import pool from "../db.js";

/* =========================================================
   GET ALL IFB
========================================================= */
export const getAllIFB = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT loan_id, beginning_balance, current_balance,
             user_name, process, subprocess, team, created_at
      FROM public.ifb
      ORDER BY loan_id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   GET IFB BY ID
========================================================= */
export const getIFBById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT loan_id, beginning_balance, current_balance,
              user_name, process, subprocess, team, created_at
       FROM public.ifb
       WHERE loan_id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "IFB not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   CREATE IFB
========================================================= */
export const createIFB = async (req, res) => {
  const {
    beginning_balance,
    current_balance,
    user_name,
    process,
    subprocess,
    team,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.ifb
        (beginning_balance, current_balance, user_name, process, subprocess, team, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       RETURNING *`,
      [
        beginning_balance || 0,
        current_balance || 0,
        user_name,
        process || null,
        subprocess || null,
        team || "IFB",
      ],
    );

    res.status(201).json({
      message: "IFB created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   UPDATE IFB
========================================================= */
export const updateIFB = async (req, res) => {
  const { id } = req.params;
  const {
    beginning_balance,
    current_balance,
    user_name,
    process,
    subprocess,
    team,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.ifb
       SET beginning_balance = $1,
           current_balance = $2,
           user_name = $3,
           process = $4,
           subprocess = $5,
           team = $6
       WHERE loan_id = $7
       RETURNING *`,
      [
        beginning_balance || 0,
        current_balance || 0,
        user_name,
        process || null,
        subprocess || null,
        team || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "IFB not found" });
    }

    res.status(200).json({
      message: "IFB updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   DELETE IFB
========================================================= */
export const deleteIFB = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.ifb
       WHERE loan_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "IFB not found" });
    }

    res.status(200).json({
      message: "IFB deleted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getIFBBalanceDifferenceByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (
      (position === "Director" || position === "Senior Director") &&
      subprocess === "Sharia Risk, Investment and Financing"
    ) {
      query = `
        SELECT 
          SUM(COALESCE("CURRENT_BALANCE", 0)) - 
          SUM(COALESCE("BEGINNING_BALANCE", 0)) AS total_difference
        FROM public."DW_IFB_DEPOSIT"
        WHERE "SUBPROCESS" = $1
      `;
      values = [subprocess];
    } else if (
      (position === "VP" || position === "CHF") &&
      process === "Interest Free Banking"
    ) {
      query = `
        SELECT 
          SUM(COALESCE("CURRENT_BALANCE", 0)) - 
          SUM(COALESCE("BEGINNING_BALANCE", 0)) AS total_difference
        FROM public."DW_IFB_DEPOSIT"
        WHERE "PROCESS" = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(COALESCE("CURRENT_BALANCE", 0)) - 
          SUM(COALESCE("BEGINNING_BALANCE", 0)) AS total_difference
        FROM public."DW_IFB_DEPOSIT"
      `;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_difference: result.rows[0]?.total_difference || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
