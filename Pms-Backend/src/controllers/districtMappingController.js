import pool from "../db.js";

// ✅ Get all district mappings
export const getAllDistrictMappings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        map_id, district_name, user_name, created_at,
        process, subprocess, team, crm_name
       FROM public.districtmapping
       ORDER BY map_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get district mappings by user context
export const getDistrictMappingsByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `SELECT * FROM public.districtmapping WHERE user_name = $1 ORDER BY map_id`;
      values = [user_id];
    } else if (position === "Manager") {
      query = `SELECT * FROM public.districtmapping WHERE team = $1 ORDER BY map_id`;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `SELECT * FROM public.districtmapping WHERE subprocess = $1 ORDER BY map_id`;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `SELECT * FROM public.districtmapping WHERE process = $1 ORDER BY map_id`;
      values = [process];
    } else if (position === "CEO") {
      query = `SELECT * FROM public.districtmapping ORDER BY map_id`;
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

// Create new district mapping
export const createDistrictMapping = async (req, res) => {
  const {
    district_name,
    user_name,
    process,
    subprocess,
    team,
    crm_name,
  } = req.body;

  if (!district_name || !user_name) {
    return res.status(400).json({
      message: "district_name and user_name are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.districtmapping 
       (district_name, user_name, created_at, process, subprocess, team, crm_name)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6)
       RETURNING *`,
      [
        district_name,
        user_name,
        process,
        subprocess,
        team,
        crm_name,
      ],
    );

    res.status(201).json({
      message: "District mapping created",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update district mapping
export const updateDistrictMapping = async (req, res) => {
  const { id } = req.params;
  const {
    district_name,
    user_name,
    process,
    subprocess,
    team,
    crm_name,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.districtmapping
       SET district_name = $1,
           user_name = $2,
           process = $3,
           subprocess = $4,
           team = $5,
           crm_name = $6
       WHERE map_id = $7
       RETURNING *`,
      [
        district_name,
        user_name,
        process,
        subprocess,
        team,
        crm_name,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "District mapping not found" });
    }

    res.status(200).json({
      message: "District mapping updated",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete district mapping
export const deleteDistrictMapping = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.districtmapping WHERE map_id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "District mapping not found" });
    }

    res.status(200).json({
      message: "District mapping deleted",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Special helper to get districts from subprocesses
export const getDistrictsFromSubprocesses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT "DISTRICT_NAME" FROM public."DW_DEPOSIT_by_DISTRICT"'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
