import pool from "../db.js";

// ✅ Get all branch grades
export const getBranchGrades = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.branch_grade ORDER BY id ASC",
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get single branch grade by ID
export const getBranchGradeById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM public.branch_grade WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch grade not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create branch grade
export const createBranchGrade = async (req, res) => {
  const { grade } = req.body;
  if (!grade) {
    return res.status(400).json({
      message: "grade is required",
    });
  }
  // Check if already exists
  const checkQuery = `
  SELECT * 
  FROM branch_grade
  WHERE grade = $1
`;

  const existing = await pool.query(checkQuery, [grade.trim()]);

  if (existing.rows.length > 0) {
    return res.status(409).json({
      message: "Branch grade with this grade already exists",
    });
  }
  try {
    const result = await pool.query(
      `INSERT INTO public.branch_grade ( grade)
       VALUES ($1)
       RETURNING *`,
      [grade],
    );

    res.status(201).json({
      message: "Branch grade created",
      branchGrade: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update branch grade
export const updateBranchGrade = async (req, res) => {
  const { id } = req.params;
  const { grade } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.branch_grade
       SET 
           grade = $1
       WHERE id = $2
       RETURNING *`,
      [grade, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch grade not found" });
    }

    res.status(200).json({
      message: "Branch grade updated",
      branchGrade: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete branch grade
export const deleteBranchGrade = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.branch_grade WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch grade not found" });
    }

    res.status(200).json({
      message: "Branch grade deleted",
      branchGrade: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
