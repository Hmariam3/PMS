import pool from "../db.js";

// Get all districts
export const getDistricts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT subprocess_id, subprocess_name 
       FROM public.sub_processess 
       WHERE subprocess_name ILIKE '%District%'
       ORDER BY subprocess_name ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get area managers by district name
export const getAreaManagersByDistrict = async (req, res) => {
  const { district_name } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, user_name, full_name, subprocess, team
       FROM public.users 
       WHERE position = 'Area Manager' 
       AND subprocess = $1
       ORDER BY full_name ASC`,
      [district_name]
    );
    res.status(200).json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get branches by district id
export const getBranchesByDistrict = async (req, res) => {
  const { district_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, branch_name, branch_code 
       FROM public.branches 
       WHERE subprocess_id = $1 
       AND branch_name ILIKE '%Branch%'
       AND id NOT IN (SELECT branch_id FROM public.area_manager_branch_mapping)
       ORDER BY branch_name ASC`,
      [district_id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get assigned branches for an area manager
export const getMappingByAreaManager = async (req, res) => {
  const { area_manager_user_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
         m.id, 
         m.district_id, 
         m.area_manager_user_id, 
         m.branch_id,
         b.branch_name,
         b.branch_code
       FROM public.area_manager_branch_mapping m
       JOIN public.branches b ON m.branch_id = b.id
       WHERE m.area_manager_user_id = $1
       ORDER BY b.branch_name ASC`,
      [area_manager_user_id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Assign branches to an area manager
export const assignBranch = async (req, res) => {
  const { district_id, area_manager_user_id, branch_ids } = req.body;

  if (!district_id || !area_manager_user_id || !branch_ids || !Array.isArray(branch_ids) || branch_ids.length === 0) {
    return res.status(400).json({ error: "Missing required fields or branch_ids is not a non-empty array" });
  }

  try {
    // Check if any of the branches are already assigned
    const checkResult = await pool.query(
      `SELECT id, branch_id FROM public.area_manager_branch_mapping WHERE branch_id = ANY($1::int[])`,
      [branch_ids]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error: "One or more selected branches are already assigned.",
        existing_assignment: checkResult.rows
      });
    }

    // Insert all branch assignments
    let values = [];
    let queryParams = [];
    let paramIndex = 1;

    for (const branchId of branch_ids) {
      values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      queryParams.push(district_id, area_manager_user_id, branchId);
    }

    const result = await pool.query(
      `INSERT INTO public.area_manager_branch_mapping 
       (district_id, area_manager_user_id, branch_id) 
       VALUES ${values.join(", ")} 
       RETURNING *`,
      queryParams
    );

    res.status(201).json({
      message: "Branches successfully assigned to Area Manager.",
      mappings: result.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Remove a branch assignment
export const removeBranchAssignment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.area_manager_branch_mapping WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mapping not found" });
    }

    res.status(200).json({
      message: "Branch assignment removed.",
      mapping: result.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get aggregated performance for an area manager's mapped branches
export const getAreaManagerPerformance = async (req, res) => {
  const { user_id } = req.body; // In frontend this is actually the username string
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(bv."LOCAL_DEPOSIT"), 0) AS total_local_deposit,
        COALESCE(SUM(bv."FCY"), 0) AS total_fcy,
        COALESCE(SUM(bv."MERCHANT_TRANSACTION_VOLUME"), 0) AS total_merchant_transaction_volume,
        COALESCE(SUM(bv."AGENT_TRANSACTION_VOLUME"), 0) AS total_agent_transaction_volume,
        COALESCE(SUM(bv."TOTAL_RESULT"), 0) AS total_result
      FROM public.users u
      JOIN public.area_manager_branch_mapping am ON am.area_manager_user_id = u.id
      JOIN public.branches b ON am.branch_id = b.id
      JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
      WHERE u.user_name = $1`,
      [user_id]
    );

    const loanResult = await pool.query(
      `SELECT 
        COALESCE(SUM(ldc."TOTAL_COLLECTION"), 0) AS total_loan_collection
      FROM public.users u
      JOIN public.area_manager_branch_mapping am ON am.area_manager_user_id = u.id
      JOIN public.branches b ON am.branch_id = b.id
      JOIN public."DW_LOAN_DUE_COLLECTION" ldc ON b.branch_code = ldc."CO_CODE"
      WHERE u.user_name = $1`,
      [user_id]
    );

    const accountResult = await pool.query(
      `SELECT 
        COALESCE(SUM(na."NO_OF_NEW_ACCTS"), 0) AS total_new_accounts
      FROM public.users u
      JOIN public.area_manager_branch_mapping am ON am.area_manager_user_id = u.id
      JOIN public.branches b ON am.branch_id = b.id
      JOIN public."DW_NEW_ACCOUNTS" na ON b.branch_code = na."BRANCH_CODE"
      WHERE u.user_name = $1`,
      [user_id]
    );

    res.status(200).json({
      ...result.rows[0],
      ...loanResult.rows[0],
      ...accountResult.rows[0]
    });
  } catch (err) {
    console.error("Error in getAreaManagerPerformance:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
