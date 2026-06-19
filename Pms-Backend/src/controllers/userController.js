import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ================= CREATE USER =================
export const createUser = async (req, res) => {

  const {
    user_name,
    full_name,
    department,
    mail_address,
    process,
    subprocess,
    team,
    title,
    position,
    role,
    organization,
    created_by,
    cbsusername,
    departmentid,
    company_code,
  } = req.body;

  try {
    //  Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM public.users WHERE user_name = $1",
      [user_name],
    );

    if (existingUser.rows.length > 0) {
      return res.status(200).json({
        message: "User already exists",
        user: existingUser.rows[0],
      });
    }

    //  Default password
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    //  Insert user
    const result = await pool.query(
      `INSERT INTO public.users
      (
        user_name,
        full_name,
        department,
        mail_address,
        process,
        subprocess,
        team,
        position,
        role,
        organization,
        created_by,
        password,
        created_at,
        title,
        cbsusername,
        departmentid,
        company_code
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14,$15,$16)
      RETURNING *`,
      [
        user_name,
        full_name,
        department,
        mail_address,
        process,
        subprocess,
        team,
        position,
        role,
        organization,
        created_by,
        hashedPassword,
        title,
        cbsusername,
        departmentid || 0,
        company_code,
      ],
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET USER BY USERNAME =================
export const getUserByuserName = async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM public.users WHERE user_name = $1",
      [username],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET USER BY EMAIL =================
export const getUserByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM public.users WHERE mail_address = $1",
      [email],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET ALL USERS =================
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        user_name,
        full_name,
        department,
        mail_address,
        title,
        created_at,
        created_by,
        password,
        process,
        subprocess,
        team,
        "position",
        reportto,
        role,
        organization,
        cbsusername,
        departmentid,
        company_code
      FROM public.users`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET USER BY POSITION =================
export const getUserByPostion = async (req, res) => {
  const { user_id, position, team, subprocess, process, supervisor } = req.body;


  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT u.*
    FROM public.users u
    INNER JOIN public.employees e
        ON u.mail_address = e.outlook_address
    WHERE u.user_name = $1
      
    ORDER BY u.id
`;
      values = [user_id];
    } else if (position === "Manager") {
      if (!team) {
        return res.status(400).json({ error: "Team is required for Manager" });
      }

      query = `
              SELECT DISTINCT u.*
              FROM public.users u
              INNER JOIN public.employees e
                  ON u.mail_address = e.outlook_address
              WHERE 
                  u.user_name = $1
                  OR (
                      u.team = $2
                      AND e.supervisor = $3
                  )
              ORDER BY u.id;
    `;
      values = [user_id, team, supervisor];
    } else if (position === "Director" || position === "Senior Director") {
      if (!subprocess) {
        return res
          .status(400)
          .json({ error: "Subprocess is required for Director" });
      }

      query = `
    SELECT DISTINCT u.*
    FROM public.users u
    INNER JOIN public.employees e
        ON u.mail_address = e.outlook_address
    WHERE 
        u.user_name = $1
        OR (
            u.subprocess = $2
            AND e.supervisor = $3
        )
    ORDER BY u.id
`;

      values = [user_id, subprocess, supervisor];
    } else if (position === "VP" || position === "CHF") {

      if (!process) {
        return res
          .status(400)
          .json({ error: "Process is required for VP/CHF" });
      }

      query = `
    SELECT DISTINCT u.*
    FROM public.users u
    INNER JOIN public.employees e
        ON u.mail_address = e.outlook_address
    WHERE 
        u.user_name = $1
        OR (
            e.supervisor = $2
            AND u.process = $3
        )
    ORDER BY u.id
`;

      values = [user_id, supervisor, process];
    } else if (position === "CEO") {
      query = `
    SELECT DISTINCT u.*
    FROM public.users u
    INNER JOIN public.employees e
        ON u.mail_address = e.outlook_address
    WHERE 
        u.user_name = $1
        OR e.supervisor = $2
    ORDER BY u.id
`;

      values = [user_id, supervisor];
    } else {
      return res.status(400).json({ error: "Invalid position value" });
    }
    // Safety check (extra protection)
    if (!query) {
      return res.status(500).json({ error: "Query not defined" });
    }
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// ================= UPDATE USER =================
export const updateUser = async (req, res) => {
  const { id } = req.params;

  const {
    process,
    subprocess,
    team,
    position,
    title,
    role,
    organization,
  } = req.body;

  try {
    let company_code = null;

    if (team) {
      const branchResult = await pool.query(
        "SELECT branch_code FROM public.branches WHERE branch_name = $1",
        [team]
      );
      if (branchResult.rows.length > 0) {
        company_code = branchResult.rows[0].branch_code;
      }
    }

    let queryStr = `UPDATE public.users
       SET process=$1,
           subprocess=$2,
           team=$3,
           position=$4,
           title=$5,
           role=$6,
           organization=$7
       WHERE id=$8
       RETURNING *`;
    let queryParams = [
      process,
      subprocess,
      team,
      position,
      title,
      role,
      organization,
      id,
    ];

    if (company_code) {
      queryStr = `UPDATE public.users
       SET process=$1,
           subprocess=$2,
           team=$3,
           position=$4,
           title=$5,
           role=$6,
           organization=$7,
           company_code=$8
       WHERE id=$9
       RETURNING *`;
      queryParams = [
        process,
        subprocess,
        team,
        position,
        title,
        role,
        organization,
        company_code,
        id,
      ];
    }

    const result = await pool.query(queryStr, queryParams);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= DELETE USER =================
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.users WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM public.users WHERE user_name = $1",
      [username],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const accessToken = jwt.sign(
      {
        user_id: user.id,
        username: user.user_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );

    const refreshToken = jwt.sign(
      { user_id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
    );

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= REFRESH TOKEN =================
export const refreshAccessToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );

    res.json({ accessToken: newAccessToken });
  });
};

// ================= CHANGE PASSWORD =================
export const changePassword = async (req, res) => {
  const { user_id } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT password FROM public.users WHERE id = $1",
      [user_id],
    );

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE public.users SET password = $1 WHERE id = $2", [
      hashedPassword,
      user_id,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT id FROM public.users WHERE user_name = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user_id = result.rows[0].id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE public.users SET password = $1 WHERE id = $2", [
      hashedPassword,
      user_id,
    ]);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= ACTIVE USERS =================
export const getAllActiveUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.activusers ORDER BY created_at DESC`,
    );

    res.json({ activeUsers: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= SEARCH USERS =================
export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_name, full_name, department, mail_address, title, created_at, created_by, password, process, subprocess, team, "position", reportto, role, organization, cbsusername, departmentid, company_code 
       FROM public.users 
       WHERE user_name ILIKE $1 OR full_name ILIKE $1 OR mail_address ILIKE $1 OR department ILIKE $1 OR process ILIKE $1 OR organization ILIKE $1
       LIMIT 100`,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= TRANSFER USER BRANCH =================
export const transferUserBranch = async (req, res) => {
  const { username } = req.params;
  const { process, subprocess, team } = req.body;

  try {
    let company_code = null;
    if (team) {
      const branchResult = await pool.query(
        "SELECT branch_code FROM public.branches WHERE branch_name = $1",
        [team]
      );
      if (branchResult.rows.length > 0) {
        company_code = branchResult.rows[0].branch_code;
      }
    }

    let userQuery = `UPDATE public.users SET process=$1, subprocess=$2, team=$3`;
    let userParams = [process, subprocess, team];
    
    if (company_code) {
      userQuery += `, company_code=$4 WHERE user_name=$5 RETURNING *`;
      userParams.push(company_code, username);
    } else {
      userQuery += ` WHERE user_name=$4 RETURNING *`;
      userParams.push(username);
    }

    const userResult = await pool.query(userQuery, userParams);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await pool.query(
      `UPDATE public.targets SET process=$1, subprocess=$2, team=$3 WHERE user_name=$4`,
      [process, subprocess, team, username]
    );

    await pool.query(
      `UPDATE public.non_deposit_target SET process=$1, subprocess=$2, team=$3 WHERE user_name=$4`,
      [process, subprocess, team, username]
    );

    res.json({
      message: "User branch and targets updated successfully",
      user: userResult.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= DELETE USER MAPPINGS =================
export const deleteUserMappings = async (req, res) => {
  const { username, type } = req.params;

  try {
    let deletedCounts = {};

    if (type === "local" || type === "all") {
      const resLocal = await pool.query(
        "DELETE FROM public.accountmapping WHERE user_name = $1 RETURNING *",
        [username]
      );
      deletedCounts.local = resLocal.rowCount;
    }
    
    if (type === "fcy" || type === "all") {
      const resFcy = await pool.query(
        "DELETE FROM public.accountmappingfcy WHERE user_name = $1 RETURNING *",
        [username]
      );
      deletedCounts.fcy = resFcy.rowCount;
    }

    if (type === "loan" || type === "all") {
      const resLoan = await pool.query(
        "DELETE FROM public.loanaccountmapping WHERE user_name = $1 RETURNING *",
        [username]
      );
      deletedCounts.loan = resLoan.rowCount;
    }

    res.json({
      message: "Mappings deleted successfully",
      deletedCounts,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
