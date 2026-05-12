import pool from "../db.js";

// ✅ Get all BAU records
export const getAllBAU = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, process, subprocess, team, username, resp1, resp2, resp3, resp4, resp5, created_date, business_usual
       FROM public.business_as_usual
       ORDER BY id`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get BAU records by user
export const getBAUByUser = async (req, res) => {
  const { username, team, subprocess, process } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    let query = `SELECT * FROM public.business_as_usual WHERE username = $1`;
    let values = [username];

    if (team) {
      query += ` AND team = $${values.length + 1}`;
      values.push(team);
    }

    if (subprocess) {
      query += ` AND subprocess = $${values.length + 1}`;
      values.push(subprocess);
    }

    if (process) {
      query += ` AND process = $${values.length + 1}`;
      values.push(process);
    }

    query += ` ORDER BY id`;

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get a single BAU record by ID
export const getBAUById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM public.business_as_usual WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "BAU record not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create a new BAU record
export const createBAU = async (req, res) => {

  const { process, subprocess, team, username, resp1, resp2, resp3, resp4, resp5, business_usual } = req.body;

  if (!username || !business_usual) {
    return res.status(400).json({ message: "Username and Business Usual (Main) are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.business_as_usual
       (process, subprocess, team, username, resp1, resp2, resp3, resp4, resp5, business_usual, created_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       RETURNING *`,
      [process || null, subprocess || null, team || null, username, resp1 || null, resp2 || null, resp3 || null, resp4 || null, resp5 || null, business_usual]
    );

    res.status(201).json({ message: "BAU record created", bau: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update a BAU record
export const updateBAU = async (req, res) => {
  const { id } = req.params;
  const { process, subprocess, team, username, resp1, resp2, resp3, resp4, resp5, business_usual } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.business_as_usual
       SET process=$1, subprocess=$2, team=$3, username=$4, resp1=$5, resp2=$6, resp3=$7, resp4=$8, resp5=$9, business_usual=$10
       WHERE id=$11
       RETURNING *`,
      [process || null, subprocess || null, team || null, username, resp1 || null, resp2 || null, resp3 || null, resp4 || null, resp5 || null, business_usual, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "BAU record not found" });

    res.status(200).json({ message: "BAU record updated", bau: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete a BAU record
export const deleteBAU = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.business_as_usual WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "BAU record not found" });

    res.status(200).json({ message: "BAU record deleted", bau: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
