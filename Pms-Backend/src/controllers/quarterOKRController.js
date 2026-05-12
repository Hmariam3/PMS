import pool from "../db.js";

// ✅ Get all Quarter OKR records
export const getAllQuarterOKR = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, process, subprocess, team, username, month1, month2, month3, month4, month5, kr, created_date
       FROM public.quarter_okr
       ORDER BY id`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get Quarter OKR records by user
export const getQuarterOKRByUser = async (req, res) => {
  const { username, team, subprocess, process } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    let query = `SELECT * FROM public.quarter_okr WHERE username = $1`;
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

// ✅ Get a single Quarter OKR record by ID
export const getQuarterOKRById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM public.quarter_okr WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Quarter OKR record not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create a new Quarter OKR record
export const createQuarterOKR = async (req, res) => {
  const { process, subprocess, team, username, month1, month2, month3, month4, month5, kr } = req.body;

  if (!username || !kr) {
    return res.status(400).json({ message: "Username and KR are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.quarter_okr
       (process, subprocess, team, username, month1, month2, month3, month4, month5, kr, created_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       RETURNING *`,
      [process || null, subprocess || null, team || null, username, month1 || null, month2 || null, month3 || null, month4 || null, month5 || null, kr]
    );

    res.status(201).json({ message: "Quarter OKR record created", quarter_okr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update a Quarter OKR record
export const updateQuarterOKR = async (req, res) => {
  const { id } = req.params;
  const { process, subprocess, team, username, month1, month2, month3, month4, month5, kr } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.quarter_okr
       SET process=$1, subprocess=$2, team=$3, username=$4, month1=$5, month2=$6, month3=$7, month4=$8, month5=$9, kr=$10
       WHERE id=$11
       RETURNING *`,
      [process || null, subprocess || null, team || null, username, month1 || null, month2 || null, month3 || null, month4 || null, month5 || null, kr, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Quarter OKR record not found" });

    res.status(200).json({ message: "Quarter OKR record updated", quarter_okr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete a Quarter OKR record
export const deleteQuarterOKR = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.quarter_okr WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Quarter OKR record not found" });

    res.status(200).json({ message: "Quarter OKR record deleted", quarter_okr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
