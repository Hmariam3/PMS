import pool from "../db.js";

// Get all objectives
export const getObjectives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.objective_id,
        p.pillar_name,
        t.title_name,
        o.objective_name,
        o.objective_weight,
        o.created_by,
        o.updated_by,
        o.created_date,
        o.updated_date
      FROM public.objectives o
      JOIN public.strategic_pillars p ON o.pillar_id = p.pillar_id
      JOIN public.titles t ON o.title_id = t.id
      ORDER BY o.objective_id;`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getObjectivesByTitle = async (req, res) => {
  const { title_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        o.objective_id,
        p.pillar_name,
        t.title_name,
        o.objective_name,
        o.objective_weight,
        o.pillar_id,
        o.title_id,
        o.created_by,
        o.updated_by,
        o.created_date,
        o.updated_date,
        o.grade
       FROM public.objectives o
       JOIN public.strategic_pillars p ON o.pillar_id = p.pillar_id
       JOIN public.titles t ON o.title_id = t.id
       WHERE o.title_id = $1
       ORDER BY o.objective_id;`,
      [title_id],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single objective by ID
export const getObjectiveById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
       FROM public.objectives
       WHERE objective_id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Objective not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new objective
export const createObjective = async (req, res) => {
  const {
    pillar_id,
    title_id,
    objective_name,
    objective_weight,
    created_by,
    grade,
  } = req.body;

  // Basic validation
  if (!pillar_id || !title_id || !objective_name) {
    return res.status(400).json({
      message: "pillar_id, title_id, and objective_name are required",
    });
  }
  // Check if already exists
  const checkQuery = `
  SELECT * 
  FROM objectives
  WHERE title_id = $1 AND objective_name = $2
`;

  const existing = await pool.query(checkQuery, [
    title_id,
    objective_name.trim(),
  ]);

  if (existing.rows.length > 0) {
    return res.status(409).json({
      message: "Objective with this title_id and objective_name already exists",
    });
  }
  try {
    const result = await pool.query(
      `INSERT INTO public.objectives
        (pillar_id, title_id, objective_name, objective_weight, created_date, updated_date, created_by,grade, updated_by)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), $5,$6,$7)
       RETURNING *`,
      [
        pillar_id,
        title_id,
        objective_name,
        objective_weight || 0,
        created_by || "system",
        grade,
        created_by || "system",
      ],
    );

    res.status(201).json({
      message: "Objective created",
      objective: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update an objective
export const updateObjective = async (req, res) => {
  const { id } = req.params;
  const {
    pillar_id,
    title_id,
    objective_name,
    objective_weight,
    updated_by,
    grade,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.objectives
       SET pillar_id = $1,
           title_id = $2,
           objective_name = $3,
           objective_weight = $4,
           updated_date = NOW(),
           updated_by = $5,
           grade = $6
       WHERE objective_id = $7
       RETURNING *`,
      [
        pillar_id,
        title_id,
        objective_name,
        objective_weight || 0,
        updated_by || "system",
        grade,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Objective not found" });
    }

    res.status(200).json({
      message: "Objective updated",
      objective: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete an objective
export const deleteObjective = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.objectives WHERE objective_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Objective not found" });
    }

    res.status(200).json({
      message: "Objective deleted",
      objective: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
