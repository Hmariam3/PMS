import pool from "../db.js";

// Get all sub-processes with process name
export const getSubProcesses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sp.subprocess_id,
        sp.subprocess_name,
        sp.subprocess_acrnm,
        sp.proc_id,
        p.process_name,
        p.process_acrnm,
        sp.created_date,
        sp.updated_date
      FROM public.sub_processess sp
      JOIN public.processess p 
        ON sp.proc_id = p.proc_id
      ORDER BY sp.subprocess_id ASC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single sub-process by ID
export const getSubProcessById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT subprocess_id, subprocess_name, subprocess_acrnm, proc_id, created_date, updated_date
       FROM public.sub_processess
       WHERE subprocess_id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sub-process not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new sub-process
export const createSubProcess = async (req, res) => {
  const { subprocess_name, subprocess_acrnm, proc_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.sub_processess (subprocess_name, subprocess_acrnm, proc_id, created_date, updated_date)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [subprocess_name, subprocess_acrnm, proc_id],
    );
    res.status(201).json({
      message: "Sub-process created",
      subProcess: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a sub-process
export const updateSubProcess = async (req, res) => {
  const { id } = req.params;
  const { subprocess_name, subprocess_acrnm, proc_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.sub_processess
       SET subprocess_name = $1, subprocess_acrnm = $2, proc_id = $3, updated_date = NOW()
       WHERE subprocess_id = $4
       RETURNING *`,
      [subprocess_name, subprocess_acrnm, proc_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sub-process not found" });
    }

    res.status(200).json({
      message: "Sub-process updated",
      subProcess: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a sub-process
export const deleteSubProcess = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.sub_processess WHERE subprocess_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sub-process not found" });
    }

    res
      .status(200)
      .json({ message: "Sub-process deleted", subProcess: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
