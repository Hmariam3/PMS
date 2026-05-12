import pool from "../db.js";

/* =========================================================
   GET ALL FCY
========================================================= */
export const getAllFcyCollections = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fcy_id, beginning_balance, current_balance,
        user_name, process, subprocess, team, created_at
      FROM public.fcy_collection
      ORDER BY fcy_id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   GET FCY BY ID
========================================================= */
export const getFcyById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        fcy_id, beginning_balance, current_balance,
        user_name, process, subprocess, team, created_at
      FROM public.fcy_collection
      WHERE fcy_id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "FCY not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   CREATE FCY
========================================================= */
export const createFcy = async (req, res) => {
  const {
    beginning_balance,
    current_balance,
    user_name,
    process,
    subprocess,
    team,
  } = req.body;

  if (!user_name) {
    return res.status(400).json({ error: "user_name is required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO public.fcy_collection
        (beginning_balance, current_balance, user_name, process, subprocess, team, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
    `,
      [
        beginning_balance || 0,
        current_balance || 0,
        user_name,
        process || null,
        subprocess || null,
        team || null,
      ],
    );

    res.status(201).json({
      message: "FCY created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   UPDATE FCY
========================================================= */
export const updateFcy = async (req, res) => {
  const { id } = req.params;
  const {
    beginning_balance,
    current_balance,
    user_name,
    process,
    subprocess,
    team,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE public.fcy_collection
      SET beginning_balance = $1,
          current_balance = $2,
          user_name = $3,
          process = $4,
          subprocess = $5,
          team = $6
      WHERE fcy_id = $7
      RETURNING *
    `,
      [
        beginning_balance || 0,
        current_balance || 0,
        user_name,
        process || null,
        subprocess || null,
        team || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "FCY not found" });
    }

    res.status(200).json({
      message: "FCY updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   DELETE FCY
========================================================= */
export const deleteFcy = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM public.fcy_collection
      WHERE fcy_id = $1
      RETURNING *
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "FCY not found" });
    }

    res.status(200).json({
      message: "FCY deleted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   GET FCY BY USER (ROLE BASED)
========================================================= */
export const getFcyByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM") {
      query = `SELECT * FROM public.fcy_collection WHERE user_name=$1 ORDER BY fcy_id`;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director") {
      query = `SELECT * FROM public.fcy_collection WHERE subprocess=$1 ORDER BY fcy_id`;
      values = [subprocess];
    } else if (position === "VP") {
      query = `SELECT * FROM public.fcy_collection WHERE process=$1 ORDER BY fcy_id`;
      values = [process];
    } else if (position === "CEO") {
      query = `SELECT * FROM public.fcy_collection ORDER BY fcy_id`;
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
export const getFcyBalanceDifferenceByUser = async (req, res) => {
  let { user_id, position, team, subprocess, process } = req.body;
  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }
  //  Normalize input
  position = position.trim();

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE user_name = $1
      `;
      values = [user_id];
    } else if (position === "Manager") {
      if (!team) {
        return res.status(400).json({ error: "Team is required for Manager" });
      }

    
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE team = $1
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      if (!subprocess) {
        return res.status(400).json({ error: "Subprocess is required" });
      }

      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE subprocess = $1
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      if (!process) {
        return res.status(400).json({ error: "Process is required" });
      }

      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE process = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
      `;
      values = [];
    } else {
      console.log("❌ Invalid position:", position);
      return res.status(400).json({ error: "Invalid position" });
    }

    //  FINAL SAFETY CHECK (prevents your error completely)
    if (!query) {
      console.error("❌ Query is undefined!");
      return res.status(500).json({ error: "Query not built" });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_difference: result.rows[0]?.total_difference || 0,
    });
  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
