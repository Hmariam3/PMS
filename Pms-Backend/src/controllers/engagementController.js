import pool from "../db.js";

// ✅ Get all engagements
export const getAllEngagements = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.engagement ORDER BY eng_id`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get engagements by user context
export const getEngagementsByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {

      query = `SELECT * FROM public.engagement WHERE user_name = $1 ORDER BY eng_id`;
      values = [user_id];
    } else if (position === "Manager") {
      query = `SELECT * FROM public.engagement WHERE team = $1 ORDER BY eng_id`;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {

      query = `SELECT * FROM public.engagement WHERE subprocess = $1 ORDER BY eng_id`;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `SELECT * FROM public.engagement WHERE process = $1 ORDER BY eng_id`;
      values = [process];
    } else if (position === "CEO") {
      query = `SELECT * FROM public.engagement ORDER BY eng_id`;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create new engagement
export const createEngagement = async (req, res) => {
  const {
    engagment,
    purpose,
    engagement_type,
    user_name,
    process,
    subprocess,
    team,
    crm_name,
    status,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.engagement 
       (engagment, purpose, engagement_type, user_name, created_at, process, subprocess, team, crm_name, status)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        engagment,
        purpose,
        engagement_type,
        user_name,
        process,
        subprocess,
        team,
        crm_name,
        status || 'Pending',
      ],
    );

    res.status(201).json({
      message: "Engagement created",
      engagement: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update engagement
export const updateEngagement = async (req, res) => {
  const { id } = req.params;
  const {
    engagment,
    purpose,
    engagement_type,
    user_name,
    process,
    subprocess,
    team,
    crm_name,
    status,
    approved_by,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.engagement
       SET engagment = $1,
           purpose = $2,
           engagement_type = $3,
           user_name = $4,
           process = $5,
           subprocess = $6,
           team = $7,
           crm_name = $8,
           status = $9,
           approved_by = $10
       WHERE eng_id = $11
       RETURNING *`,
      [
        engagment,
        purpose,
        engagement_type,
        user_name,
        process,
        subprocess,
        team,
        crm_name,
        status,
        approved_by,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Engagement not found" });
    }

    res.status(200).json({
      message: "Engagement updated",
      engagement: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Approve engagement
export const approveEngagement = async (req, res) => {
  const { id } = req.params;
  const { approved_by } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.engagement
       SET status = 'Approved',
           approved_by = $1
       WHERE eng_id = $2
       RETURNING *`,
      [approved_by, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Engagement not found" });
    }

    res.status(200).json({
      message: "Engagement approved",
      engagement: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete engagement
export const deleteEngagement = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.engagement WHERE eng_id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Engagement not found" });
    }

    res.status(200).json({
      message: "Engagement deleted",
      engagement: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
