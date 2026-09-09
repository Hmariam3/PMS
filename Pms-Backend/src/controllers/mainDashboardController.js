import pool from "../db.js";

/**
 * Fetch Main Dashboard performance data based on user role.
 * User passes their title, position, and organization in the request body.
 */
export const getPerformanceData = async (req, res) => {
  const { username, title, position, organization, subprocess, team } = req.body;

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
  } else if (title === "District Director" ||
    (title?.startsWith("Director") && title?.endsWith("District")) ||
    ((position === "Director" || position === "Senior Director") && organization === "Do")) {
    scope = "own_district";
  } else if (title === "Area Manager") {
    scope = "assigned_branches";
  } else if (title?.includes("Branch Manager") ||
    (title?.includes("Manager Operation Management") &&
      (team?.includes?.("Eco") || team?.includes?.("Micro")))) {
    // On "Eco" / "Micro" branches the Manager Operation Management acts as
    // the branch manager, so they get the branch-level view
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
      // Bank-level summary — joined to branches so the KPI cards stay
      // consistent with the district/AM/branch breakdowns (unmatched
      // branch_vital rows, e.g. head-office adjustments, are excluded)
      const summaryQuery = `
        SELECT SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) as local_deposit, 
               SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) as fcy 
        FROM public.branch_vital bv
        JOIN public.branches b ON b.branch_code = bv."COMPANY_CODE"
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
        WHERE sp.subprocess_name ILIKE '%District'
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

      // ── Loan collection actuals (DW_LOAN_DUE_COLLECTION, keyed by "CO_CODE").
      // Kept in separate queries and merged by key — a straight join into the
      // queries above would double-count deposit/FCY where CO_CODE repeats.
      const loanSummaryRes = await pool.query(
        `SELECT SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"`
      );
      result.summary.loan_collection = Number(loanSummaryRes.rows[0]?.loan_collection) || 0;

      const loanDistrictRes = await pool.query(
        `SELECT sp.subprocess_name as district_name,
                SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"
         JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
         GROUP BY sp.subprocess_name`
      );
      const loanByDistrict = {};
      loanDistrictRes.rows.forEach((r) => { loanByDistrict[r.district_name] = Number(r.loan_collection) || 0; });
      result.districtBreakdown = result.districtBreakdown.map((d) => ({
        ...d,
        loan_collection: loanByDistrict[d.district_name] || 0,
      }));

      const loanBranchRes = await pool.query(
        `SELECT "CO_CODE" as branch_code,
                SUM(COALESCE(CAST("TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION"
         GROUP BY "CO_CODE"`
      );
      const loanByBranch = {};
      loanBranchRes.rows.forEach((r) => { loanByBranch[r.branch_code] = Number(r.loan_collection) || 0; });
      result.branchBreakdown = result.branchBreakdown.map((b) => ({
        ...b,
        loan_collection: loanByBranch[b.branch_code] || 0,
      }));

      const loanAmRes = await pool.query(
        `SELECT amu.user_name,
                SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"
         JOIN public.area_manager_branch_mapping amb ON amb.branch_id = b.id
         JOIN public.users amu ON amu.id = amb.area_manager_user_id
         WHERE amu.title = 'Area Manager'
         GROUP BY amu.user_name`
      );
      const loanByAm = {};
      loanAmRes.rows.forEach((r) => { loanByAm[r.user_name] = Number(r.loan_collection) || 0; });
      result.areaManagerBreakdown = result.areaManagerBreakdown.map((a) => ({
        ...a,
        loan_collection: loanByAm[a.user_name] || 0,
      }));

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

      // ── Loan collection actuals for this district
      const loanSummaryRes = await pool.query(
        `SELECT SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"
         JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
         WHERE sp.subprocess_name = $1`,
        [districtName]
      );
      result.summary.loan_collection = Number(loanSummaryRes.rows[0]?.loan_collection) || 0;

      const loanBranchRes = await pool.query(
        `SELECT l."CO_CODE" as branch_code,
                SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"
         JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
         WHERE sp.subprocess_name = $1
         GROUP BY l."CO_CODE"`,
        [districtName]
      );
      const loanByBranch = {};
      loanBranchRes.rows.forEach((r) => { loanByBranch[r.branch_code] = Number(r.loan_collection) || 0; });
      result.branchBreakdown = result.branchBreakdown.map((b) => ({
        ...b,
        loan_collection: loanByBranch[b.branch_code] || 0,
      }));

      const loanAmRes = await pool.query(
        `SELECT amu.user_name,
                SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"
         JOIN public.area_manager_branch_mapping amb ON amb.branch_id = b.id
         JOIN public.users amu ON amu.id = amb.area_manager_user_id
         JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
         WHERE amu.title = 'Area Manager'
           AND sp.subprocess_name = $1
         GROUP BY amu.user_name`,
        [districtName]
      );
      const loanByAm = {};
      loanAmRes.rows.forEach((r) => { loanByAm[r.user_name] = Number(r.loan_collection) || 0; });
      result.areaManagerBreakdown = result.areaManagerBreakdown.map((a) => ({
        ...a,
        loan_collection: loanByAm[a.user_name] || 0,
      }));

      // District-level row so the district breakdown table shows the DD's
      // own district (sums of the district's branch rows)
      const distTotals = result.branchBreakdown.reduce(
        (acc, b) => ({
          local_deposit: acc.local_deposit + (Number(b.local_deposit) || 0),
          fcy: acc.fcy + (Number(b.fcy) || 0),
          loan_collection: acc.loan_collection + (Number(b.loan_collection) || 0),
        }),
        { local_deposit: 0, fcy: 0, loan_collection: 0 }
      );
      result.districtBreakdown = [
        {
          district_name: districtName,
          local_deposit: distTotals.local_deposit,
          fcy: distTotals.fcy,
          loan_collection: distTotals.loan_collection,
        },
      ];

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

      // ── Loan collection actuals for the assigned branches
      const loanBranchRes = await pool.query(
        `SELECT l."CO_CODE" as branch_code,
                SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION" l
         JOIN public.branches b ON b.branch_code = l."CO_CODE"
         JOIN public.area_manager_branch_mapping amb ON amb.branch_id = b.id
         JOIN public.users amu ON amu.id = amb.area_manager_user_id
         WHERE amu.user_name = $1
         GROUP BY l."CO_CODE"`,
        [username]
      );
      const loanByBranch = {};
      let loanTotal = 0;
      loanBranchRes.rows.forEach((r) => {
        loanByBranch[r.branch_code] = Number(r.loan_collection) || 0;
        loanTotal += Number(r.loan_collection) || 0;
      });
      result.summary.loan_collection = loanTotal;
      result.branchBreakdown = result.branchBreakdown.map((b) => ({
        ...b,
        loan_collection: loanByBranch[b.branch_code] || 0,
      }));
      result.areaManagerBreakdown = result.areaManagerBreakdown.map((a) => ({
        ...a,
        loan_collection: loanTotal,
      }));

      // District-level row for the AM's district — covers ALL branches of the
      // district, not only the ones assigned to this AM
      const amDistrictName = amRes.rows[0]?.district_name;
      if (amDistrictName && !amDistrictName.includes(",")) {
        const distRes = await pool.query(
          `SELECT sp.subprocess_name AS district_name,
                  SUM(COALESCE(CAST(bv."LOCAL_DEPOSIT" AS NUMERIC), 0)) AS local_deposit,
                  SUM(COALESCE(CAST(bv."FCY" AS NUMERIC), 0)) AS fcy
           FROM public.sub_processess sp
           LEFT JOIN public.branches b ON b.subprocess_id = sp.subprocess_id
           LEFT JOIN public.branch_vital bv ON b.branch_code = bv."COMPANY_CODE"
           WHERE sp.subprocess_name = $1
           GROUP BY sp.subprocess_name`,
          [amDistrictName]
        );
        const loanDistRes = await pool.query(
          `SELECT SUM(COALESCE(CAST(l."TOTAL_COLLECTION" AS NUMERIC), 0)) AS loan_collection
           FROM public."DW_LOAN_DUE_COLLECTION" l
           JOIN public.branches b ON b.branch_code = l."CO_CODE"
           JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
           WHERE sp.subprocess_name = $1`,
          [amDistrictName]
        );
        if (distRes.rows[0]) {
          result.districtBreakdown = [
            {
              district_name: amDistrictName,
              local_deposit: distRes.rows[0].local_deposit,
              fcy: distRes.rows[0].fcy,
              loan_collection: Number(loanDistRes.rows[0]?.loan_collection) || 0,
            },
          ];
        }
      }

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

      // ── Loan collection actual for the branch
      const loanRes = await pool.query(
        `SELECT SUM(COALESCE(CAST("TOTAL_COLLECTION" AS NUMERIC), 0)) as loan_collection
         FROM public."DW_LOAN_DUE_COLLECTION"
         WHERE "CO_CODE" = $1`,
        [company_code]
      );
      const loanVal = Number(loanRes.rows[0]?.loan_collection) || 0;
      result.summary.loan_collection = loanVal;
      result.branchBreakdown = result.branchBreakdown.map((b) => ({
        ...b,
        loan_collection: loanVal,
      }));
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in MainDashboardController:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
