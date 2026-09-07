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

      // All Districts breakdown (driven from sub_processess so every district
      // appears, even those without branch_vital rows yet)
      const districtsQuery = `
        SELECT sp.subprocess_name as district_name,
               SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit, 
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.sub_processess sp
        LEFT JOIN public.branches b ON b.subprocess_id = sp.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE sp.subprocess_name ILIKE '%District%'
        GROUP BY sp.subprocess_name
        ORDER BY sp.subprocess_name
      `;
      const districtsRes = await pool.query(districtsQuery);
      result.districtBreakdown = districtsRes.rows;

      // Area Managers breakdown — actuals rolled up from mapped branches
      const amQuery = `
        SELECT amu.user_name, amu.full_name as am_name,
               COUNT(DISTINCT b.id) as branch_count,
               STRING_AGG(DISTINCT sp.subprocess_name, ', ' ORDER BY sp.subprocess_name) as district_name,
               SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit,
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.users amu
        JOIN public.area_manager_branch_mapping amb ON amb.area_manager_user_id = amu.id
        JOIN public.branches b ON amb.branch_id = b.id
        LEFT JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE amu.title = 'Area Manager'
        GROUP BY amu.user_name, amu.full_name
        ORDER BY district_name, amu.full_name
      `;
      const amRes = await pool.query(amQuery);
      result.areaManagerBreakdown = amRes.rows;

      // All branches breakdown — bank-wide
      const allBranchesQuery = `
        SELECT b.branch_name, b.branch_code,
               sp.subprocess_name as district_name,
               COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit,
               COALESCE(CAST(bv."FCY" AS NUMERIC), 0) as fcy
        FROM public.branches b
        LEFT JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE b.branch_code IS NOT NULL AND b.branch_code <> ''
        ORDER BY district_name, b.branch_name
      `;
      const allBranchesRes = await pool.query(allBranchesQuery);
      result.branchBreakdown = allBranchesRes.rows;

    } else if (scope === "own_district") {
      // The district name is expected to be in user.subprocess
      const districtName = subprocess;

      const summaryQuery = `
        SELECT SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit, 
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.branch_vital bv
        JOIN public.branches b ON b.branch_code = bv."COMPANY_CODE"
        JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        WHERE sp.subprocess_name = $1
      `;
      const summaryRes = await pool.query(summaryQuery, [districtName]);
      result.summary = {
        local_deposit: summaryRes.rows[0]?.local_deposit || 0,
        fcy: summaryRes.rows[0]?.fcy || 0
      };

      const branchesQuery = `
        SELECT b.branch_name, b.branch_code,
               sp.subprocess_name as district_name,
               COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit, 
               COALESCE(CAST(bv."FCY" AS NUMERIC), 0) as fcy
        FROM public.branches b
        JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE sp.subprocess_name = $1
        ORDER BY b.branch_name
      `;
      const branchesRes = await pool.query(branchesQuery, [districtName]);
      result.branchBreakdown = branchesRes.rows;

      // Area Managers of this district — actuals rolled up from their
      // mapped branches (each AM maps to a single district)
      const amQuery = `
        SELECT amu.user_name, amu.full_name as am_name,
               COUNT(DISTINCT b.id) as branch_count,
               STRING_AGG(DISTINCT sp.subprocess_name, ', ' ORDER BY sp.subprocess_name) as district_name,
               SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit,
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.users amu
        JOIN public.area_manager_branch_mapping amb ON amb.area_manager_user_id = amu.id
        JOIN public.branches b ON amb.branch_id = b.id
        JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE amu.title = 'Area Manager'
          AND sp.subprocess_name = $1
        GROUP BY amu.user_name, amu.full_name
        ORDER BY amu.full_name
      `;
      const amRes = await pool.query(amQuery, [districtName]);
      result.areaManagerBreakdown = amRes.rows;

    } else if (scope === "assigned_branches") {
      const branchesQuery = `
        SELECT b.branch_name, b.branch_code,
               sp.subprocess_name as district_name,
               COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit, 
               COALESCE(CAST(bv."FCY" AS NUMERIC), 0) as fcy
        FROM public.area_manager_branch_mapping amb
        JOIN public.users amu ON amu.id = amb.area_manager_user_id
        JOIN public.branches b ON amb.branch_id = b.id
        LEFT JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE amu.user_name = $1
        ORDER BY b.branch_name
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

      // The requesting AM's own rollup row ("own scope" visibility)
      const amQuery = `
        SELECT amu.user_name, amu.full_name as am_name,
               COUNT(DISTINCT b.id) as branch_count,
               STRING_AGG(DISTINCT sp.subprocess_name, ', ' ORDER BY sp.subprocess_name) as district_name,
               SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit,
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy
        FROM public.users amu
        JOIN public.area_manager_branch_mapping amb ON amb.area_manager_user_id = amu.id
        JOIN public.branches b ON amb.branch_id = b.id
        LEFT JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE amu.user_name = $1
        GROUP BY amu.user_name, amu.full_name
      `;
      const amRes = await pool.query(amQuery, [username]);
      result.areaManagerBreakdown = amRes.rows;

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

      // Own branch row ("own branch" visibility)
      const branchQuery = `
        SELECT b.branch_name, b.branch_code,
               sp.subprocess_name as district_name,
               COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0) as local_deposit,
               COALESCE(CAST(bv."FCY" AS NUMERIC), 0) as fcy
        FROM public.branches b
        LEFT JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
        WHERE b.branch_code = $1
      `;
      const branchRes = await pool.query(branchQuery, [company_code]);
      result.branchBreakdown = branchRes.rows;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in MainDashboardController:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
