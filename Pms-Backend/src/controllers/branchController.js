// controllers/branchController.js
import pool from "../db.js";

// Get all branches
export const getBranches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        b.branch_name,
        b.branch_code,
        b.subprocess_id,
        b.created_at,
        b.updated_at,
       sp.subprocess_name as sub_proccess,
        sp.subprocess_acrnm,
        sp.proc_id
      FROM public.branches b
      LEFT JOIN public.sub_processess sp 
        ON b.subprocess_id = sp.subprocess_id
      ORDER BY b.id ASC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// Get a single branch by ID
export const getBranchById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, branch_name, created_at, updated_at FROM public.branches WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const createBranch = async (req, res) => {
  const { branch_name, branch_code, subprocess_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.branches (branch_name, branch_code, subprocess_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [branch_name, branch_code, subprocess_id],
    );

    res.status(201).json({
      message: "Branch created",
      branch: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a branch
export const updateBranch = async (req, res) => {
  const { id } = req.params;
  const { branch_name, branch_code, subprocess_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.branches
       SET branch_name = $1, branch_code = $2, subprocess_id = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [branch_name, branch_code, subprocess_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json({
      message: "Branch updated",
      branch: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a branch
export const deleteBranch = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.branches WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json({
      message: "Branch deleted",
      branch: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const validateBranchCode = async (req, res) => {
  const { team, company_code } = req.body;
  try {
    const result = await pool.query(
      "SELECT id, branch_name, branch_code FROM public.branches WHERE branch_name = $1",
      [team],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: "Branch not found",
      });
    }

    const branch = result.rows[0];

    //  Check match
    if (branch.branch_code === company_code) {
      return res.status(200).json({
        valid: true,
        message: "Company code matches branch",
        branch,
      });
    } else {
      return res.status(400).json({
        valid: false,
        message: "Company code does NOT match this branch",
        expected: branch.branch_code,
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getBranchByCode = async (req, res) => {
  const { branch_code } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
          b.id,
          b.branch_name,
          b.branch_code,
          s.subprocess_name,
          s.subprocess_acrnm
       FROM public.branches b
       JOIN public.sub_processess s
          ON b.subprocess_id = s.subprocess_id
       WHERE
          b.branch_code = $1`,
      [branch_code],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Branch not found or no matching subprocess",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};
