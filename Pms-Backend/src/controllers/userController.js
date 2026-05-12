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
    console.log("createUser",req.body);
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
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT * FROM public.users
        WHERE user_name = $1
        ORDER BY id
      `;
      values = [user_id];
    } else if (position === "Manager") {
      if (!team) {
        return res.status(400).json({ error: "Team is required for Manager" });
      }

      query = `
        SELECT * FROM public.users
        WHERE team = $1
        ORDER BY id
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      if (!subprocess) {
        return res
          .status(400)
          .json({ error: "Subprocess is required for Director" });
      }

      query = `
        SELECT * FROM public.users
        WHERE subprocess = $1
        ORDER BY id
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      if (!process) {
        return res
          .status(400)
          .json({ error: "Process is required for VP/CHF" });
      }

      query = `
        SELECT * FROM public.users
        WHERE process = $1
        ORDER BY id
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT * FROM public.users
        ORDER BY id
      `;
      values = [];
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
    user_name,
    full_name,
    department,
    mail_address,
    title,
    cbsusername,
    departmentid,
    company_code,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.users
       SET user_name=$1,
           full_name=$2,
           department=$3,
           mail_address=$4,
           title=$5,
           cbsusername=$6,
           departmentid=$7,
           company_code=$8
       WHERE id=$9
       RETURNING *`,
      [
        user_name,
        full_name,
        department,
        mail_address,
        title,
        cbsusername,
        departmentid,
        company_code,
        id,
      ],
    );

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
