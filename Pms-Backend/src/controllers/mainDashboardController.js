import pool from "../db.js";

/**
 * Fetch Main Dashboard performance data based on user role.
 * User passes their title, position, and organization in the request body.
 */
export const getPerformanceData = async (req, res) => {
  const { username, title, position, organization, subprocess } = req.body;

  if (!username) {
    return res.status(400).json({ error: "UserName is required." });
  }

  // Determine the scope based on the user's title and position
  let scope = "self";
  if (["Chief Executive Officer", "Chief, Commercial Officer"].includes(title) || title?.toLowerCase().startsWith("chief") ||
    ["Senior Director, Talent Acquisition and Career Pathways", "Director, Talent and Performance Management", "Manager, Employee Performance Management"].includes(title)) {
    scope = "enterprise";
  } else if (["Director, District Coordination and Support", "Manager, District Coordination", "Manager, District Execution Monitoring"].includes(title)) {
    scope = "all_districts";
  } else if (title === "District Director" || ((position === "Director" || position === "Senior Director") && organization === "Do")) {
    scope = "own_district";
  } else if (title === "Area Manager") {
    scope = "assigned_branches";
  } else if (title?.includes("Branch Manager")) {
    scope = "own_branch";
  }

  try {
    let result = {
      scope: scope,
      summary: { local_deposit: 0, fcy: 0 },
      districtBreakdown: [],
      branchBreakdown: []
    };

    if (scope === "enterprise" || scope === "all_districts") {
      // Bank-level summary
      const summaryQuery = `
        SELECT SUM(COALESCE(CAST("LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit, 
               SUM(COALESCE(CAST("FCY" AS NUMERIC), 0)) as fcy 
        FROM public.branch_vital
      `;
      const summaryRes = await pool.query(summaryQuery);
      result.summary = {
        local_deposit: summaryRes.rows[0]?.local_deposit || 0,
        fcy: summaryRes.rows[0]?.fcy || 0
      };

      // All Districts breakdown
      const districtsQuery = `
        SELECT b.subprocess_id as district_name, 
               SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit, 
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.branch_vital bv
        JOIN public.branches b ON b.branch_code = bv."COMPANY_CODE"
        GROUP BY b.subprocess_id
      `;
      const districtsRes = await pool.query(districtsQuery);
      result.districtBreakdown = districtsRes.rows;

    } else if (scope === "own_district") {
      // The district name is expected to be in user.subprocess
      const districtName = subprocess;

      const summaryQuery = `
        SELECT SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit, 
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.branch_vital bv
        JOIN public.branches b ON b.branch_code = bv."COMPANY_CODE"
        WHERE b.subprocess_id = $1
      `;
      const summaryRes = await pool.query(summaryQuery, [districtName]);
      result.summary = {
        local_deposit: summaryRes.rows[0]?.local_deposit || 0,
        fcy: summaryRes.rows[0]?.fcy || 0
      };

      const branchesQuery = `
        SELECT b.branch_name, b.branch_code,
               COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit, 
               COALESCE(CAST(bv."FCY" AS NUMERIC), 0) as fcy
        FROM public.branches b
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE b.subprocess_id = $1
      `;
      const branchesRes = await pool.query(branchesQuery, [districtName]);
      result.branchBreakdown = branchesRes.rows;

    } else if (scope === "assigned_branches") {
      const branchesQuery = `
        SELECT b.branch_name, b.branch_code,
               COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit, 
               COALESCE(CAST(bv."FCY" AS NUMERIC), 0) as fcy
        FROM public.area_manager_branch_mapping amb
        JOIN public.branches b ON amb.branch_id = b.id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE amb.area_manager_user_id = $1
      `;
      const branchesRes = await pool.query(branchesQuery, [username]);
      result.branchBreakdown = branchesRes.rows;

      // Summary is sum of assigned branches
      let totalDep = 0;
      let totalFcy = 0;
      result.branchBreakdown.forEach(row => {
        totalDep += Number(row.local_deposit);
        totalFcy += Number(row.fcy);
      });
      result.summary = { local_deposit: totalDep, fcy: totalFcy };

    } else if (scope === "own_branch") {
      // Need company_code from the user object
      const { company_code } = req.body;

      const summaryQuery = `
        SELECT COALESCE(CAST("LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit, 
               COALESCE(CAST("FCY" AS NUMERIC), 0) as fcy 
        FROM public.branch_vital
        WHERE "COMPANY_CODE" = $1
      `;
      const summaryRes = await pool.query(summaryQuery, [company_code]);
      result.summary = {
        local_deposit: summaryRes.rows[0]?.local_deposit || 0,
        fcy: summaryRes.rows[0]?.fcy || 0
      };
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in MainDashboardController:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
