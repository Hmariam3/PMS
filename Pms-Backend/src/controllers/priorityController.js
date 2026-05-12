import pool from "../db.js";

// Get all priorities
export const getAllPriorities = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT priority_id, priority_name, detail, user_name, created_at,
              process, subprocess, team, start_date, end_date
       FROM public.priority
       ORDER BY priority_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single priority by ID
export const getPriorityById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT priority_id, priority_name, detail, user_name, created_at,
              process, subprocess, team, start_date, end_date
       FROM public.priority
       WHERE priority_id = $1`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Priority not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create priority (AUTO Monday → Friday)
export const createPriority = async (req, res) => {
  const { priority_name, detail, user_name, process, subprocess, team } =
    req.body;

  if (!priority_name) {
    return res.status(400).json({ message: "priority_name is required" });
  }

  try {
    // 🔍 Step 1: Check if already exists this week
    const existing = await pool.query(
      `SELECT 1
       FROM public.priority
       WHERE user_name = $1
         AND priority_name = $2
         AND start_date = DATE_TRUNC('week', CURRENT_DATE)::date
         AND end_date = (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '4 days')::date`,
      [user_name || "system", priority_name],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Priority already exists for this week",
      });
    }

    // ✅ Step 2: Insert if not exists
    const result = await pool.query(
      `INSERT INTO public.priority 
        (priority_name, detail, user_name, process, subprocess, team, created_at, start_date, end_date)
        VALUES (
          $1, $2, $3, $4, $5, $6,
          NOW(),
          (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa')::date,
          ((CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa')::date + 4)
        )
       RETURNING *`,
      [
        priority_name,
        detail || "",
        user_name || "system",
        process || null,
        subprocess || null,
        team || null,
      ],
    );

    res.status(201).json({
      message: "Priority created",
      priority: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update priority (RESET week to Monday → Friday)
export const updatePriority = async (req, res) => {
  const { id } = req.params;
  const { priority_name, detail, user_name, process, subprocess, team } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE public.priority
       SET priority_name = $1,
           detail = $2,
           user_name = $3,
           process = $4,
           subprocess = $5,
           team = $6,
           start_date = DATE_TRUNC('week', CURRENT_DATE)::date,
           end_date = (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '4 days')::date
       WHERE priority_id = $7
       RETURNING *`,
      [
        priority_name,
        detail || "",
        user_name || "system",
        process || null,
        subprocess || null,
        team || null,
        id,
      ],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Priority not found" });

    res.status(200).json({
      message: "Priority updated",
      priority: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete priority
export const deletePriority = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.priority
       WHERE priority_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Priority not found" });

    res.status(200).json({
      message: "Priority deleted",
      priority: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get priorities by user (Relaxed date check for debugging)
export const getPriorityByUser = async (req, res) => {
  const { user_id } = req.body;
  // console.log("Fetching priorities for user_id:", user_id);

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
      priority_id,
      priority_name,
      detail,
      user_name,
      created_at,
      process,
      subprocess,
      team,
      start_date,
      end_date
   FROM public.priority
   WHERE LOWER(user_name) = LOWER($1)
   AND start_date BETWEEN
       date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa')::date
       AND
       (
         date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa')::date
         + 6
       )`,
      [user_id]
    );

    // console.log(`Found ${result.rows.length} priorities for ${user_id}`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Database Error in getPriorityByUser:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


export const getUsersWithoutPriority = async (req, res) => {
  const { supervisor } = req.body;
  if (!supervisor) {
    return res.status(400).json({ error: "Supervisor is required" });
  }

  try {
    // 1️ Get employees + users (important: user_name key)
    const employeesResult = await pool.query(
      `SELECT 
          u.user_name,
          u.full_name,
          u.mail_address,
          u.department,
          u.position,
          u.team
       FROM public.employees e
       JOIN public.users u
         ON u.mail_address = e.outlook_address
       WHERE e.supervisor = $1`,
      [supervisor],
    );

    const employees = employeesResult.rows;

    if (employees.length === 0) {
      return res.status(200).json([]);
    }

    const userNames = employees.map((e) => e.user_name);

    // 2️ Get users who submitted priority (USE user_name, NOT email)
    const priorityResult = await pool.query(
      `SELECT DISTINCT user_name
   FROM public.priority
   WHERE user_name = ANY($1)
   AND start_date =
       (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa')::date
   AND end_date =
       ((CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa')::date + 4)`,
      [userNames],
    );

    const submittedUsers = priorityResult.rows.map((p) => p.user_name);
    // 3️ Find missing users
    const missingUsers = employees.filter(
      (emp) => !submittedUsers.includes(emp.user_name),
    );

    // 4️ Final response
    const result = missingUsers.map((u) => ({
      user_name: u.user_name,
      full_name: u.full_name,
      email: u.mail_address,
      department: u.department,
      position: u.position,
      team: u.team,
    }));

    res.status(200).json({
      count: result.length,
      result,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
