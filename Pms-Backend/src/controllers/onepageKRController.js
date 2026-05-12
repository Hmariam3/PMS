import pool from "../db.js";

// ✅ Get all Key Results
export const getAllKR = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT kr_id, objective_id, kr_detail, weight, created_by, created_date, process, subprocess, team
       FROM public.onepagekr
       ORDER BY kr_id`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getOkrByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body; // from route params

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }
  try {
    let query;
    let values;
      // Normal users: fetch objectives created by this user
      query = `
      SELECT *
        FROM public.onepagekr
        WHERE created_by = $1
        ORDER BY objective_id
      `;
      values = [user_id];
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single KR by ID
export const getKRById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT kr_id, objective_id, kr_detail, weight, created_by, created_date, process, subprocess, team
       FROM public.onepagekr
       WHERE kr_id = $1`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "KR not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create a new KR
export const createKR = async (req, res) => {
  const {
    objective_id,
    kr_detail,
    weight,
    created_by,
    process,
    subprocess,
    team,
  } = req.body;

  if (!objective_id || !kr_detail) {
    return res
      .status(400)
      .json({ message: "objective_id and kr_detail are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.onepagekr 
       (objective_id, kr_detail, weight, created_by, created_date, process, subprocess, team)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
       RETURNING *`,
      [
        objective_id,
        kr_detail,
        weight || 0,
        created_by || "system",
        process || null,
        subprocess || null,
        team || null,
      ],
    );

    res.status(201).json({ message: "KR created", kr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update a KR
export const updateKR = async (req, res) => {
  const { id } = req.params;
  const {
    objective_id,
    kr_detail,
    weight,
    created_by,
    process,
    subprocess,
    team,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.onepagekr
       SET objective_id = $1,
           kr_detail = $2,
           weight = $3,
           created_by = $4,
           process = $5,
           subprocess = $6,
           team = $7
       WHERE kr_id = $8
       RETURNING *`,
      [
        objective_id,
        kr_detail,
        weight || 0,
        created_by || "system",
        process || null,
        subprocess || null,
        team || null,
        id,
      ],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "KR not found" });

    res.status(200).json({ message: "KR updated", kr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete a KR
export const deleteKR = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.onepagekr
       WHERE kr_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "KR not found" });

    res.status(200).json({ message: "KR deleted", kr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
