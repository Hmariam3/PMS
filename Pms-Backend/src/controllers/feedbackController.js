import pool from "../db.js";

/* =========================
   CREATE FEEDBACK
========================= */
export const createFeedback = async (req, res) => {
  const {
    user_name,
    position,
    branch,
    subject,
    message,
    process,
    subprocess,
    sender,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.feedbacks 
      (user_name, "position", branch, subject, message, process, subprocess, sender, status, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'new',NOW())
      RETURNING *`,
      [
        user_name,
        position,
        branch,
        subject,
        message,
        process,
        subprocess,
        sender,
      ],
    );

    return res.status(201).json({
      message: "Feedback created",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Create feedback error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   GET ALL FEEDBACKS
========================= */
export const getFeedbacks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        user_name,
        "position",
        branch,
        subject,
        message,
        status,
        created_at,
        process,
        subprocess,
        sender
      FROM public.feedbacks
      ORDER BY created_at DESC
    `);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   GET FEEDBACK BY ID
========================= */
export const getFeedbackById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM public.feedbacks WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   UPDATE FEEDBACK
========================= */
export const updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { subject, message, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.feedbacks
       SET subject = $1,
           message = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [subject, message, status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json({
      message: "Feedback updated",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   DELETE FEEDBACK
========================= */
export const deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.feedbacks WHERE id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json({
      message: "Feedback deleted",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};
export const replyFeedback = async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  try {
    const result = await pool.query(
      `
      UPDATE public.feedbacks
      SET reply = $1,
          status = 'replied',
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [reply, id],
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};
export const getByUserFeedbacks = async (req, res) => {
  const { user_name } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        *
      FROM public.feedbacks
      WHERE user_name = $1
      ORDER BY created_at DESC
      `,
      [user_name],
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};
