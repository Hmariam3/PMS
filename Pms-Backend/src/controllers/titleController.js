// controllers/titleController.js
import pool from "../db.js";

// Get all titles
export const getTitles = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title_name, created_date, updated_date FROM public.titles ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single title by ID
export const getTitleById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, title_name, created_date, updated_date FROM public.titles WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Title not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new title
export const createTitle = async (req, res) => {
  const { title_name } = req.body;
  if (!title_name) {
    return res.status(400).json({
      message: "title_name is required",
    });
  }
  // Check if already exists
  const checkQuery = `
  SELECT * 
  FROM titles
  WHERE title_name = $1
`;

  const existing = await pool.query(checkQuery, [title_name.trim()]);

  if (existing.rows.length > 0) {
    return res.status(409).json({
      message: "Title with this title_name already exists",
    });
  }
  try {
    const result = await pool.query(
      `INSERT INTO public.titles (title_name, created_date, updated_date)
       VALUES ($1, NOW(), NOW())
       RETURNING *`,
      [title_name]
    );

    res.status(201).json({
      message: "Title created",
      title: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a title
export const updateTitle = async (req, res) => {
  const { id } = req.params;
  const { title_name } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.titles
       SET title_name = $1, updated_date = NOW()
       WHERE id = $2
       RETURNING *`,
      [title_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Title not found" });
    }

    res.status(200).json({
      message: "Title updated",
      title: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a title
export const deleteTitle = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.titles WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Title not found" });
    }

    res.status(200).json({
      message: "Title deleted",
      title: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};