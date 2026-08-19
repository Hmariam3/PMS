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
      `
      SELECT DISTINCT subprocess_name
      FROM public.sub_processess
      WHERE subprocess_name ILIKE '%District'
      `
    );
    res.status(200).json(result.rows);
    // console.log("result.rows", result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all targets with district mapping
// Get targets with district mappings by user
// Get mapped districts for user
export const getMappedDistrictsByUser = async (req, res) => {
  try {
    const { user_name } = req.params;

    const result = await pool.query(
      `
      SELECT 
          district_name,
          user_name,
          process,
          subprocess,
          team,
          crm_name
      FROM public.districtmapping
      WHERE LOWER(user_name) = LOWER($1)
      ORDER BY district_name
      `,
      [user_name]
    );
    res.status(200).json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getTargetsAndDepositByDistricts = async (req, res) => {
  try {
    const { districts } = req.body;

    const result = await getTargetTotals(districts);
    // console.log('targetTotals', result);
    res.status(200).json(result);

  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: "Server error",
    });
  }
};

const getTargetTotals = async (districts) => {

  const result = await pool.query(
    `
    SELECT
        LOWER(u.subprocess) AS district_key,
        u.subprocess AS district_name,

        COALESCE(t.deposit_target, 0) AS total_deposit_target,
        COALESCE(t.fcy_target, 0) AS total_fcy_target,
        COALESCE(t.loan_collection, 0) AS total_loan_collection,
        COALESCE(t.cash_collection, 0) AS total_cash_collection,
        COALESCE(t.cash_deposited_crm, 0) AS total_cash_deposited_crm

    FROM public.users u
    JOIN public.targets t
        ON LOWER(u.user_name) = LOWER(t.user_name)

    WHERE LOWER(u.subprocess) = ANY(
        SELECT LOWER(unnest($1::text[]))
    )
    AND u.position IN ('Director', 'Senior Director');
    `,
    [districts]
  );

  const targetTotals = result.rows;

  // call deposit function here
  const depositTotals = await getDepositTotals(districts);
  // merge both results
  const merged = targetTotals.map((target) => {

    const deposit = depositTotals.find(
      (d) => d.district_key === target.district_key
    );

    return {
      district_name: target.district_name,

      total_deposit_target: target.total_deposit_target,
      total_fcy_target: target.total_fcy_target,
      total_loan_collection: target.total_loan_collection,
      total_cash_collection: target.total_cash_collection,
      total_cash_deposited_crm: target.total_cash_deposited_crm,

      total_beginning_balance:
        deposit?.total_beginning_balance || 0,

      total_current_balance:
        deposit?.total_current_balance || 0,

      balance_difference:
        deposit?.balance_difference || 0,
    };
  });

  return merged;
};
const getDepositTotals = async (districts) => {
  const result = await pool.query(
    `
    SELECT
        LOWER("SUBPROCESS") AS district_key,
        "SUBPROCESS" AS district_name,

        COALESCE(SUM("BEGINING_BALANCE"), 0) AS total_beginning_balance,
        COALESCE(SUM("CURRENT_BALANCE"), 0) AS total_current_balance,

        COALESCE(SUM("CURRENT_BALANCE"), 0)
        - COALESCE(SUM("BEGINING_BALANCE"), 0)
        AS balance_difference

    FROM public."DW_DEPOSIT_by_DISTRICT"

    WHERE LOWER("SUBPROCESS") = ANY(
        SELECT LOWER(unnest($1::text[]))
    )

    GROUP BY "SUBPROCESS"
    `,
    [districts]
  );

  return result.rows;
};