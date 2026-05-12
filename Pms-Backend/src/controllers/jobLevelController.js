// controllers/jobLevelController.js
import pool from "../db.js";

// Get all job levels
export const getJobLevels = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, job_level, created_at, updated_at FROM public.job_levels ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single job level by ID
export const getJobLevelById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, job_level, created_at, updated_at FROM public.job_levels WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job level not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new job level
export const createJobLevel = async (req, res) => {
  const { job_level } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.job_levels (job_level, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING *`,
      [job_level]
    );

    res.status(201).json({
      message: "Job level created",
      jobLevel: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a job level
export const updateJobLevel = async (req, res) => {
  const { id } = req.params;
  const { job_level } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.job_levels
       SET job_level = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [job_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job level not found" });
    }

    res.status(200).json({
      message: "Job level updated",
      jobLevel: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a job level
export const deleteJobLevel = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.job_levels WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job level not found" });
    }

    res.status(200).json({
      message: "Job level deleted",
      jobLevel: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};