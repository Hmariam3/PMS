// controllers/payGradeController.js
import pool from "../db.js";

// Get all pay grades
export const getPayGrades = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, pay_grade, pay_scale_level FROM public.pay_grades ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single pay grade by ID
export const getPayGradeById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, pay_grade, pay_scale_level FROM public.pay_grades WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pay grade not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new pay grade
export const createPayGrade = async (req, res) => {
  const { pay_grade, pay_scale_level } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.pay_grades (pay_grade, pay_scale_level)
       VALUES ($1, $2)
       RETURNING *`,
      [pay_grade, pay_scale_level]
    );

    res.status(201).json({
      message: "Pay grade created",
      payGrade: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a pay grade
export const updatePayGrade = async (req, res) => {
  const { id } = req.params;
  const { pay_grade, pay_scale_level } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.pay_grades
       SET pay_grade = $1, pay_scale_level = $2
       WHERE id = $3
       RETURNING *`,
      [pay_grade, pay_scale_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pay grade not found" });
    }

    res.status(200).json({
      message: "Pay grade updated",
      payGrade: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a pay grade
export const deletePayGrade = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.pay_grades WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pay grade not found" });
    }

    res.status(200).json({
      message: "Pay grade deleted",
      payGrade: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};