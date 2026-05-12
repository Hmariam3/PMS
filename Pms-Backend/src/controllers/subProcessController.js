import pool from "../db.js";

// Get all sub-processes
// Get all sub-processes with process name
export const getSubProcesses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sp.id,
        sp.process_name AS sub_process_name,
          sp.process_id,
        p.process_name AS process_name,
        sp.created_date,
        sp.updated_date
      FROM public.sub_processess sp
      JOIN public.processess p 
        ON sp.process_id = p.id
      ORDER BY sp.id ASC
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
      `SELECT id, process_name, created_date, process_id, updated_date
       FROM public.sub_processess
       WHERE id = $1`,
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
  const { sub_process_name, process_id } = req.body;
  console.log("req.body", req.body);
  try {
    const result = await pool.query(
      `INSERT INTO public.sub_processess (process_name, process_id, created_date, updated_date)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [sub_process_name, process_id],
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
  const { process_name, process_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.sub_processess
       SET process_name = $1, process_id = $2, updated_date = NOW()
       WHERE id = $3
       RETURNING *`,
      [process_name, process_id, id],
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
      "DELETE FROM public.sub_processess WHERE id = $1 RETURNING *",
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
