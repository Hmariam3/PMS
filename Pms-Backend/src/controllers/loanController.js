import pool from "../db.js";

/* =========================================================
   GET ALL LOAN COLLECTIONS
========================================================= */
export const getAllLoanCollections = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        loan_id, beginning_balance, current_balance,
        user_name, process, subprocess, team, created_at
      FROM public.loan_collection
      ORDER BY loan_id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   GET LOAN BY ID
========================================================= */
export const getLoanById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        loan_id, beginning_balance, current_balance,
        user_name, process, subprocess, team, created_at
      FROM public.loan_collection
      WHERE loan_id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   CREATE LOAN COLLECTION
========================================================= */
export const createLoan = async (req, res) => {
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
      INSERT INTO public.loan_collection
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
      message: "Loan created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   UPDATE LOAN COLLECTION
========================================================= */
export const updateLoan = async (req, res) => {
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
      UPDATE public.loan_collection
      SET beginning_balance = $1,
          current_balance = $2,
          user_name = $3,
          process = $4,
          subprocess = $5,
          team = $6
      WHERE loan_id = $7
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
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json({
      message: "Loan updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   DELETE LOAN COLLECTION
========================================================= */
export const deleteLoan = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM public.loan_collection
      WHERE loan_id = $1
      RETURNING *
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json({
      message: "Loan deleted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================================================
   GET LOAN BY USER (ROLE BASED)
========================================================= */
export const getLoanByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `SELECT * FROM public.loan_collection WHERE user_name=$1 ORDER BY loan_id`;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director") {
      query = `SELECT * FROM public.loan_collection WHERE subprocess=$1 ORDER BY loan_id`;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `SELECT * FROM public.loan_collection WHERE process=$1 ORDER BY loan_id`;
      values = [process];
    } else if (position === "CEO") {
      query = `SELECT * FROM public.loan_collection ORDER BY loan_id`;
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
export const getLoanBalanceDifferenceByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    //  CRM / Individual → filter by user company_code
    if (position === "Individual") {
      query = `
        SELECT 
          SUM(COALESCE(d."TOTAL_COLLECTION", 0))  AS total_difference
        FROM public."DW_LOAN_DUE_COLLECTION" d
        JOIN public.users u 
          ON u.company_code = d."CO_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];

      //  Director → filter by subprocess + company_code
    } else if (position === "Manager") {
      query = `
        SELECT 
  
          SUM(COALESCE(d."TOTAL_COLLECTION", 0)) AS total_difference
        FROM public."DW_LOAN_DUE_COLLECTION" d
        JOIN public.users u 
          ON u.company_code = d."CO_CODE"
        WHERE u.user_name = $1
      `;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
    SELECT 
        SUM(COALESCE("TOTAL_COLLECTION", 0)) AS total_difference
    FROM public."DW_LOAN_DUE_COLLECTION" 
    WHERE "SUBPROCESS" = $1
      `;
      values = [subprocess];

      //  VP / CHF → filter by process
    } else if (position === "VP" || position === "CHF") {
      query = `
       SELECT 
       SUM(COALESCE("TOTAL_COLLECTION", 0)) AS total_difference
    FROM public."DW_LOAN_DUE_COLLECTION" 
    WHERE "PROCESS" = $1
      `;
      values = [process];

      //  CEO → no filter
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(COALESCE(d."TOTAL_COLLECTION", 0))   AS total_difference
        FROM public."DW_LOAN_DUE_COLLECTION"
      `;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_difference: result.rows[0]?.total_difference || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getLoanBalanceDifferenceByUserMapped = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query = "";
    let values = [];

    // CRM / Individual
    if (position === "CRM" || position === "Individual") {

      query = `
        SELECT
          COALESCE(
            SUM(COALESCE(collected_balance, 0)),
          0) AS total_difference

        FROM public.loanaccountmapping

        WHERE user_name = $1
      `;

      values = [user_id];

    }

    // Manager
    else if (position === "Manager") {

      query = `
        SELECT
          COALESCE(
            SUM(COALESCE(collected_balance, 0)),
          0) AS total_difference

        FROM public.loanaccountmapping

        WHERE user_name = $1
      `;

      values = [user_id];

    }

    // Director / Senior Director
    else if (
      position === "Director" ||
      position === "Senior Director"
    ) {

      query = `
        SELECT
          COALESCE(
            SUM(COALESCE(collected_balance, 0)),
          0) AS total_difference

        FROM public.loanaccountmapping

        WHERE subprocess = $1
      `;

      values = [subprocess];

    }

    // VP / CHF
    else if (position === "VP" || position === "CHF") {

      query = `
        SELECT
          COALESCE(
            SUM(COALESCE(collected_balance, 0)),
          0) AS total_difference

        FROM public.loanaccountmapping

        WHERE process = $1
      `;

      values = [process];

    }

    // CEO
    else if (position === "CEO") {

      query = `
        SELECT
          COALESCE(
            SUM(COALESCE(collected_balance, 0)),
          0) AS total_difference

        FROM public.loanaccountmapping
      `;

    }

    else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_difference:
        result.rows[0]?.total_difference || 0,
    });

  } catch (err) {

    console.error(err.message);

    res.status(500).json({
      error: "Server error",
    });

  }
};