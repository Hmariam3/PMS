import pool from "../db.js"; // your database connection

// Get all strategic pillars
export const getPillars = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pillar_id, pillar_name, created_date, updated_date, created_by, updated_by
       FROM public.strategic_pillars
       ORDER BY pillar_id ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single pillar by ID
export const getPillarById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT pillar_id, pillar_name, created_date, updated_date, created_by, updated_by
       FROM public.strategic_pillars
       WHERE pillar_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pillar not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new pillar
export const createPillar = async (req, res) => {
  const { pillar_name, created_by } = req.body;

  if (!pillar_name || pillar_name.trim() === "") {
    return res.status(400).json({ message: "Pillar name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.strategic_pillars
        (pillar_name, created_date, updated_date, created_by, updated_by)
       VALUES ($1, NOW(), NOW(), $2, $2)
       RETURNING *`,
      [pillar_name, created_by || "system"]
    );

    res.status(201).json({
      message: "Pillar created",
      pillar: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a pillar
export const updatePillar = async (req, res) => {
  const { id } = req.params;
  const { pillar_name, updated_by } = req.body;

  if (!pillar_name || pillar_name.trim() === "") {
    return res.status(400).json({ message: "Pillar name is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE public.strategic_pillars
       SET pillar_name = $1,
           updated_date = NOW(),
           updated_by = $2
       WHERE pillar_id = $3
       RETURNING *`,
      [pillar_name, updated_by || "system", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pillar not found" });
    }

    res.status(200).json({
      message: "Pillar updated",
      pillar: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a pillar
export const deletePillar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.strategic_pillars WHERE pillar_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pillar not found" });
    }

    res.status(200).json({
      message: "Pillar deleted",
      pillar: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};