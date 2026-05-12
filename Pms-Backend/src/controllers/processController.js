// controllers/processController.js
import pool from "../db.js";

// Get all processes
export const getProcesses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, process_name, created_date, updated_date FROM public.processess ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single process by ID
export const getProcessById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, process_name, created_date, updated_date FROM public.processess WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Process not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new process
export const createProcess = async (req, res) => {
  const { process_name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.processess (process_name, created_date, updated_date)
       VALUES ($1, NOW(), NOW())
       RETURNING *`,
      [process_name]
    );
    res.status(201).json({
      message: "Process created",
      process: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a process
export const updateProcess = async (req, res) => {
  const { id } = req.params;
  const { process_name } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.processess
       SET process_name = $1, updated_date = NOW()
       WHERE id = $2
       RETURNING *`,
      [process_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Process not found" });
    }

    res.status(200).json({
      message: "Process updated",
      process: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a process
export const deleteProcess = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.processess WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Process not found" });
    }

    res.status(200).json({ message: "Process deleted", process: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};