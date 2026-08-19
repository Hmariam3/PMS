// controllers/processController.js
import pool from "../db.js";

// Get all processes
export const getProcesses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT proc_id, process_name, process_acrnm, created_date, updated_date FROM public.processess ORDER BY proc_id ASC"
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
      "SELECT proc_id, process_name, process_acrnm, created_date, updated_date FROM public.processess WHERE proc_id = $1",
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
  const { process_name, process_acrnm } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.processess (process_name, process_acrnm, created_date, updated_date)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [process_name, process_acrnm]
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
  const { process_name, process_acrnm } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.processess
       SET process_name = $1, process_acrnm = $2, updated_date = NOW()
       WHERE proc_id = $3
       RETURNING *`,
      [process_name, process_acrnm, id]
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
      "DELETE FROM public.processess WHERE proc_id = $1 RETURNING *",
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