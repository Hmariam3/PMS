import pool from "../db.js";

// ✅ Get all objectives (with process, subprocess, team)
export const getOnePageObjectives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT objective_id, objective_detail, weight, created_by, created_date,
              process, subprocess, team
       FROM public.onepageobjective
       ORDER BY objective_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET user by ID FOR CRM
export const getUserById = async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM public.onepageobjective WHERE created_by = $1`,
      [user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getObjectivesByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body; // from route params

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }
  try {
    let query;
    let values;
    // if (position == "CRM") {
      // Normal users: fetch objectives created by this user
      query = `
        SELECT objective_id, objective_detail, weight, created_by, created_date, process, subprocess, team
        FROM public.onepageobjective
        WHERE created_by = $1
        ORDER BY objective_id
      `;
      values = [user_id];
    // }
    // if (position == "Director" || position == "Senior Director") {
    //   // Normal users: fetch objectives created by this user
    //   query = `
    //     SELECT objective_id, objective_detail, weight, created_by, created_date, process, subprocess, team
    //     FROM public.onepageobjective
    //     WHERE subprocess = $1
    //     ORDER BY objective_id
    //   `;
    //   values = [subprocess];
    // }
    // if (position == "VP") {
    //   // Normal users: fetch objectives created by this user
    //   query = `
    //     SELECT objective_id, objective_detail, weight, created_by, created_date, process, subprocess, team
    //     FROM public.onepageobjective
    //     WHERE process = $1
    //     ORDER BY objective_id
    //   `;
    //   values = [process];
    // }
    // if (position == "CEO") {
    //   // Normal users: fetch objectives created by this user
    //   query = `
    //     SELECT objective_id, objective_detail, weight, created_by, created_date, process, subprocess, team
    //     FROM public.onepageobjective
    //     ORDER BY objective_id
    //   `;
    //   values = [];
    // }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET users by subprocess
export const getUsersBySubprocess = async (req, res) => {
  const { subprocess } = req.query; // get from query string: ?subprocess=XYZ

  if (!subprocess) {
    return res.status(400).json({ error: "Subprocess is required" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM public.onepageobjective WHERE subprocess = $1 ORDER BY full_name`,
      [subprocess],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for this subprocess" });
    }

    res.status(200).json(result.rows); // returns array of users
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// ✅ Get single objective by ID (with process, subprocess, team)
export const getOnePageObjectiveById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT objective_id, objective_detail, weight, created_by, created_date,
              process, subprocess, team
       FROM public.onepageobjective
       WHERE objective_id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Objective not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create objective (with process, subprocess, team)
export const createOnePageObjective = async (req, res) => {
  const { objective_detail, weight, created_by, process, subprocess, team } =
    req.body;

  if (!objective_detail) {
    return res.status(400).json({ message: "objective_detail is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.onepageobjective
       (objective_detail, weight, created_by, process, subprocess, team, created_date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        objective_detail,
        weight || 0,
        created_by || "system",
        process || "",
        subprocess || "",
        team || "",
      ],
    );

    res
      .status(201)
      .json({ message: "Objective created", objective: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update objective (with process, subprocess, team)
export const updateOnePageObjective = async (req, res) => {
  const { id } = req.params;
  const { objective_detail, weight, created_by, process, subprocess, team } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE public.onepageobjective
       SET objective_detail = $1,
           weight = $2,
           created_by = $3,
           process = $4,
           subprocess = $5,
           team = $6
       WHERE objective_id = $7
       RETURNING *`,
      [
        objective_detail,
        weight || 0,
        created_by || "system",
        process || "",
        subprocess || "",
        team || "",
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Objective not found" });
    }

    res
      .status(200)
      .json({ message: "Objective updated", objective: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete objective
export const deleteOnePageObjective = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.onepageobjective
       WHERE objective_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Objective not found" });
    }

    res
      .status(200)
      .json({ message: "Objective deleted", objective: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
