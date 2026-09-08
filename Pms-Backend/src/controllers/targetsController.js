import pool from "../db.js";

// Get all targets
export const getAllTargets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM public.targets
       ORDER BY target_id`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single target by ID
export const getTargetById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *
       FROM public.targets
       WHERE target_id = $1`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Target not found" });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new target
export const createTarget = async (req, res) => {
  const {
    user_name,
    deposit_target,
    fcy_target,
    loan_collection,
    process,
    subprocess,
    team,
    cash_collection,
    michu_loan_collection,
    created_by,
    approved_by,
  } = req.body;

  if (!user_name) {
    return res.status(400).json({ message: "user_name is required" });
  }

  try {
    const check = await pool.query(
      `SELECT 1 FROM public.targets WHERE user_name = $1 LIMIT 1`,
      [user_name],
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ message: "Target already registered" });
    }

    const result = await pool.query(
      `INSERT INTO public.targets (
        user_name,
        deposit_target,
        fcy_target,
        loan_collection,
        process,
        subprocess,
        team,
        cash_collection,
        michu_loan_collection,
        created_by,
        approved_by,
        created_at,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),'Pending')
      RETURNING *`,
      [
        user_name,
        deposit_target || 0,
        fcy_target || 0,
        loan_collection || 0,
        process || null,
        subprocess || null,
        team || null,
        cash_collection || 0,
        michu_loan_collection || 0,
        created_by || null,
        approved_by || null,
      ],
    );

    res.status(201).json({
      message: "Target created",
      target: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update a target
export const updateTarget = async (req, res) => {
  const { id } = req.params;

  const {
    user_name,
    deposit_target,
    fcy_target,
    loan_collection,
    process,
    subprocess,
    team,
    cash_collection,
    michu_loan_collection,
    created_by,
    approved_by,
    status,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.targets
       SET 
        user_name = $1,
        deposit_target = $2,
        fcy_target = $3,
        loan_collection = $4,
        process = $5,
        subprocess = $6,
        team = $7,
        cash_collection = $8,
        michu_loan_collection = $9,
        created_by = $10,
        approved_by = $11,
        status = $12
       WHERE target_id = $13
       RETURNING *`,
      [
        user_name,
        deposit_target || 0,
        fcy_target || 0,
        loan_collection || 0,
        process || null,
        subprocess || null,
        team || null,
        cash_collection || 0,
        michu_loan_collection || 0,
        created_by || null,
        approved_by || null,
        status || "Pending",
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Target not found" });
    }

    res.status(200).json({
      message: "Target updated",
      target: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Approve target
export const approveTarget = async (req, res) => {
  const { id } = req.params;

  const { approved_by, approved_at, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.targets
       SET
        approved_by = $1,
        approved_at = $2,
        status = $3
       WHERE target_id = $4
       RETURNING *`,
      [
        approved_by || null,
        approved_at || new Date(),
        status || "Approved",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Target not found",
      });
    }

    res.status(200).json({
      message: "Target approved successfully",
      target: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

// Delete a target
export const deleteTarget = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.targets
       WHERE target_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Target not found" });

    res.status(200).json({ message: "Target deleted", target: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getTargetByUser = async (req, res) => {
  const { user_id, position, supervisor, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual" || position === "Area Manager") {

      query = `
      SELECT t.*
      FROM public.targets t
      WHERE t.user_name = $1
      ORDER BY t.target_id
    `;

      values = [user_id];

    } else if (position === "Manager") {

      query = `
SELECT t.*
FROM public.targets t
INNER JOIN public.users u
    ON t.user_name = u.user_name
INNER JOIN public.employees e
    ON u.mail_address = e.outlook_address
WHERE
    u.user_name = $1
    OR (
        u.team = $2
        AND e.supervisor = $3
    )
ORDER BY t.target_id;
    `;

      values = [user_id, team, supervisor];

    } else if (position === "Director" || position === "Senior Director") {

      query = `
SELECT t.*
FROM public.targets t
INNER JOIN public.users u
    ON t.user_name = u.user_name
INNER JOIN public.employees e
    ON u.mail_address = e.outlook_address
WHERE
    u.user_name = $1
    OR (
        u.subprocess = $2
        AND e.supervisor = $3
    )
ORDER BY t.target_id;
    `;

      values = [user_id, subprocess, supervisor];

    } else if (position === "VP" || position === "CHF") {

      query = `
SELECT t.*
FROM public.targets t
INNER JOIN public.users u
    ON t.user_name = u.user_name
INNER JOIN public.employees e
    ON u.mail_address = e.outlook_address
WHERE
    u.user_name = $1
    OR (
        u.process = $2
        AND e.supervisor = $3
    )
ORDER BY t.target_id;
    `;

      values = [user_id, process, supervisor];

    } else if (position === "CEO") {

      query = `
SELECT t.*
FROM public.targets t
INNER JOIN public.users u
    ON t.user_name = u.user_name
INNER JOIN public.employees e
    ON u.mail_address = e.outlook_address
WHERE
    u.user_name = $1
    OR e.supervisor = $1
ORDER BY t.target_id;
    `;

      values = [user_id, supervisor];
    }

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getTargetsSummaryByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;



  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values;

    const baseQuery = `
      SELECT
          COUNT(*) AS record_count,

          SUM(COALESCE(deposit_target,0)) AS total_deposit,
          SUM(COALESCE(fcy_target,0)) AS total_fcy,
          SUM(COALESCE(loan_collection,0)) AS total_loan,
          SUM(COALESCE(cash_collection,0)) AS total_cash_collection,
          SUM(COALESCE(michu_loan_collection,0)) AS michu_loan_collection,

          SUM(
              COALESCE(deposit_target,0) +
              COALESCE(fcy_target,0) +
              COALESCE(loan_collection,0) +
              COALESCE(cash_collection,0) +
              COALESCE(michu_loan_collection,0)
          ) AS grand_total

      FROM public.targets
    `;

    // CRM / Individual
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {

      query = baseQuery + `
        WHERE user_name = $1
        AND status = 'Approved'
      `;

      values = [user_id];

    }

    // Manager
    else if (position === "Manager") {

      query = baseQuery + `
        WHERE user_name = $1
        AND status = 'Approved'
      `;

      values = [user_id];

    }

    // Director / Senior Director
    else if (
      position === "Director" ||
      position === "Senior Director"
    ) {

      query = baseQuery + `
        WHERE user_name = $1
        AND status = 'Approved'
      `;

      values = [user_id];
    }

    // VP / CHF
    else if (position === "VP" || position === "CHF") {

      query = baseQuery + `
        WHERE user_name = $1
        AND status = 'Approved'
      `;

      values = [user_id];

    }

    // CEO
    else if (position === "CEO") {

      query = baseQuery + `
        WHERE user_name = $1
        AND status = 'Approved'
      `;

      values = [user_id];

    }

    else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    const row = result.rows[0];

    // if no approved records found
    // if no approved records found, return zero values
    if (!row || Number(row.record_count) === 0) {
      return res.status(200).json({
        total_deposit: 0,
        total_fcy: 0,
        total_loan: 0,
        cash_collection: 0,
        michu_loan_collection: 0,
        grand_total: 0,
      });
    }

    res.status(200).json({
      total_deposit: row.total_deposit || 0,
      total_fcy: row.total_fcy || 0,
      total_loan: row.total_loan || 0,

      cash_collection: row.total_cash_collection || 0,
      michu_loan_collection: row.michu_loan_collection || 0,

      grand_total: row.grand_total || 0,
    });

  } catch (err) {

    console.error(err.message);

    res.status(500).json({
      error: "Server error",
    });

  }
};

//Only for Loan collection
export const getLoanCollectionTargetByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values = [];

    // CRM / Individual
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {

      query = `
        SELECT
          COALESCE(SUM(t.loan_collection),0) AS loan_collection
        FROM public.targets t
        WHERE t.user_name = $1
          AND t.status = 'Approved'
      `;

      values = [user_id];

    }

    // Manager
    else if (position === "Manager") {

      query = `
        SELECT
          COALESCE(SUM(t.loan_collection),0) AS loan_collection
        FROM public.targets t
        WHERE t.user_name = $1
          AND t.status = 'Approved'
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
          COALESCE(SUM(t.loan_collection),0) AS loan_collection
        FROM public.targets t
        WHERE t.user_name = $1
          AND t.status = 'Approved'
      `;

      values = [user_id];
      // query = `
      //   SELECT
      //     COALESCE(SUM(t.loan_collection),0) AS loan_collection
      //   FROM public.targets t
      //   INNER JOIN public.users u
      //     ON u.user_name = t.user_name
      //   WHERE u.position = 'Manager'
      //     AND u.subprocess = $1
      //     AND t.status = 'Approved'
      // `;

      // values = [subprocess];

    }

    // VP / CHF
    else if (
      position === "VP" ||
      position === "CHF"
    ) {
      query = `
        SELECT
          COALESCE(SUM(t.loan_collection),0) AS loan_collection
        FROM public.targets t
        WHERE t.user_name = $1
          AND t.status = 'Approved'
      `;

      values = [user_id];
      // query = `
      //   SELECT
      //     COALESCE(SUM(t.loan_collection),0) AS loan_collection
      //   FROM public.targets t
      //   INNER JOIN public.users u
      //     ON u.user_name = t.user_name
      //   WHERE u.position = 'Manager'
      //     AND u.process = $1
      //     AND t.status = 'Approved'
      // `;

      // values = [process];

    }

    // CEO
    else if (position === "CEO") {

      query = `
        SELECT
          COALESCE(SUM(t.loan_collection),0) AS loan_collection
        FROM public.targets t
        WHERE t.user_name = $1
          AND t.status = 'Approved'
      `;

      values = [user_id];
      // query = `
      //   SELECT
      //     COALESCE(SUM(t.loan_collection),0) AS loan_collection
      //   FROM public.targets t
      //   INNER JOIN public.users u
      //     ON u.user_name = t.user_name
      //   WHERE u.position = 'Manager'
      //     AND t.status = 'Approved'
      // `;

    }

    else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);

    return res.status(200).json({
      loan_collection: result.rows[0]?.loan_collection || 0,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};


export const getCashTargetsByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values = [];

    // CRM / Individual
    if (position === "CRM" || position === "Individual" || position === "Area Manager") {

      query = `
        SELECT
          COALESCE(cash_collection, 0) AS cash_collection,
          COALESCE(michu_loan_collection, 0) AS michu_loan_collection
        FROM public.targets
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    // Manager
    else if (position === "Manager") {

      // query = `
      //   SELECT

      //   (
      //     SELECT COALESCE(cash_collection, 0)
      //     FROM public.targets
      //     WHERE team = $1
      //       AND status = 'Approved'
      //       AND cash_collection > 0
      //     ORDER BY created_at ASC
      //     LIMIT 1
      //   ) AS cash_collection,

      //   (
      //     SELECT COALESCE(michu_loan_collection, 0)
      //     FROM public.targets
      //     WHERE team = $1
      //       AND status = 'Approved'
      //       AND michu_loan_collection > 0
      //     ORDER BY created_at ASC
      //     LIMIT 1
      //   ) AS michu_loan_collection
      // `;

      // values = [team];
      query = `
        SELECT
          COALESCE(cash_collection, 0) AS cash_collection,
          COALESCE(michu_loan_collection, 0) AS michu_loan_collection
        FROM public.targets
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    // Director / Senior Director
    else if (
      position === "Director" ||
      position === "Senior Director"
    ) {

      // query = `
      //   SELECT

      //   (
      //     SELECT COALESCE(SUM(cash_collection), 0)
      //     FROM (
      //       SELECT DISTINCT ON (team)
      //         team,
      //         cash_collection
      //       FROM public.targets
      //       WHERE subprocess = $1
      //         AND status = 'Approved'
      //         AND cash_collection > 0
      //       ORDER BY team, created_at ASC
      //     ) x
      //   ) AS cash_collection,

      //   (
      //     SELECT COALESCE(SUM(michu_loan_collection), 0)
      //     FROM (
      //       SELECT DISTINCT ON (team)
      //         team,
      //         michu_loan_collection
      //       FROM public.targets
      //       WHERE subprocess = $1
      //         AND status = 'Approved'
      //         AND michu_loan_collection > 0
      //       ORDER BY team, created_at ASC
      //     ) x
      //   ) AS michu_loan_collection
      // `;

      // values = [subprocess];
      query = `
        SELECT
          COALESCE(cash_collection, 0) AS cash_collection,
          COALESCE(michu_loan_collection, 0) AS michu_loan_collection
        FROM public.targets
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    // VP / CHF
    else if (position === "VP" || position === "CHF") {

      // query = `
      //   SELECT

      //   (
      //     SELECT COALESCE(SUM(cash_collection), 0)
      //     FROM (
      //       SELECT DISTINCT ON (team)
      //         team,
      //         cash_collection
      //       FROM public.targets
      //       WHERE process = $1
      //         AND status = 'Approved'
      //         AND cash_collection > 0
      //       ORDER BY team, created_at ASC
      //     ) x
      //   ) AS cash_collection,

      //   (
      //     SELECT COALESCE(SUM(michu_loan_collection), 0)
      //     FROM (
      //       SELECT DISTINCT ON (team)
      //         team,
      //         michu_loan_collection
      //       FROM public.targets
      //       WHERE process = $1
      //         AND status = 'Approved'
      //         AND michu_loan_collection > 0
      //       ORDER BY team, created_at ASC
      //     ) x
      //   ) AS michu_loan_collection
      // `;

      // values = [process];

      query = `
        SELECT
          COALESCE(cash_collection, 0) AS cash_collection,
          COALESCE(michu_loan_collection, 0) AS michu_loan_collection
        FROM public.targets
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    // CEO
    else if (position === "CEO") {

      // query = `
      //   SELECT

      //   (
      //     SELECT COALESCE(SUM(cash_collection), 0)
      //     FROM (
      //       SELECT DISTINCT ON (team)
      //         team,
      //         cash_collection
      //       FROM public.targets
      //       WHERE status = 'Approved'
      //         AND cash_collection > 0
      //       ORDER BY team, created_at ASC
      //     ) x
      //   ) AS cash_collection,

      //   (
      //     SELECT COALESCE(SUM(michu_loan_collection), 0)
      //     FROM (
      //       SELECT DISTINCT ON (team)
      //         team,
      //         michu_loan_collection
      //       FROM public.targets
      //       WHERE status = 'Approved'
      //         AND michu_loan_collection > 0
      //       ORDER BY team, created_at ASC
      //     ) x
      //   ) AS michu_loan_collection
      // `;
      query = `
        SELECT
          COALESCE(cash_collection, 0) AS cash_collection,
          COALESCE(michu_loan_collection, 0) AS michu_loan_collection
        FROM public.targets
        WHERE user_name = $1
          AND status = 'Approved'
        LIMIT 1
      `;

      values = [user_id];
    }

    else {
      return res.status(400).json({
        error: "Invalid position",
      });
    }

    const result = await pool.query(query, values);
    const row = result.rows[0];

    // No records found
    if (!row) {
      return res.status(200).json({
        cash_collection: 0,
        michu_loan_collection: 0,
        grand_total: 0,
      });
    }

    const cashCollection = Number(row.cash_collection) || 0;
    const michuloanCollection = Number(row.michu_loan_collection) || 0;

    return res.status(200).json({
      cash_collection: cashCollection,
      michu_loan_collection: michuloanCollection,
      grand_total: cashCollection + michuloanCollection,
    });

  } catch (err) {
    console.error(err.message);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

/**
 * getMainDashboardTargets
 * Role-based target aggregation for the Main Dashboard.
 *
 * Rules (by user title):
 *  - C-Suite / Chiefs / Enterprise Directors / All-Districts roles
 *      → SUM of deposit_target + fcy_target for ALL users whose title
 *        matches a District Director ("Director, <Name> District"), i.e.
 *        the bank-wide target that flows through District Directors.
 *        Also returns districtTargets[] so the district breakdown rows
 *        on the dashboard get their own target per district.
 *  - District Director (Director of a district / org = "Do")
 *      → own target for the summary, plus branchTargets[] for every
 *        Branch Manager target inside his/her district.
 *  - Area Manager
 *      → own target for the summary, plus branchTargets[] for the
 *        Branch Manager targets of his/her assigned branches.
 *  - Branch Manager / Individual
 *      → only the requesting user's own approved target row.
 */
export const getMainDashboardTargets = async (req, res) => {
  const { username, title, position, organization, subprocess, company_code } = req.body;

  if (!username || !title) {
    return res.status(400).json({ error: "UserName and title are required." });
  }

  const enterpriseTitles = [
    "Chief Executive Officer",
    "Chief, Commercial Officer",
    "Director, District Coordination and Support",
    "Manager, District Coordination",
    "Manager, District Execution Monitoring",
    "Senior Director, Talent Acquisition and Career Pathways",
    "Director, Talent and Performance Management",
    "Manager, Employee Performance Management",
  ];

  const isEnterprise =
    enterpriseTitles.includes(title) ||
    title.toLowerCase().startsWith("chief");

  const isOwnDistrict =
    title === "District Director" ||
    ((position === "Director" || position === "Senior Director") &&
      organization === "Do");

  const isAreaManager = title === "Area Manager";

  try {
    let query;
    let values;

    if (isEnterprise) {
      // Sum the targets of every District Director ("Director, X District").
      // Those targets represent the bank-wide operational commitments.
      query = `
        SELECT
          SUM(COALESCE(t.deposit_target, 0)) AS total_deposit,
          SUM(COALESCE(t.fcy_target, 0))     AS total_fcy,
          SUM(COALESCE(t.loan_collection, 0)) AS total_loan
        FROM public.targets t
        INNER JOIN public.users u ON t.user_name = u.user_name
        WHERE u.title ILIKE 'Director%District'
          AND t.status = 'Approved'
      `;
      values = [];
    } else {
      // District Director / Area Manager / Branch Manager / Individual
      // → own target row only
      query = `
        SELECT
          SUM(COALESCE(deposit_target, 0)) AS total_deposit,
          SUM(COALESCE(fcy_target, 0))     AS total_fcy,
          SUM(COALESCE(loan_collection, 0)) AS total_loan
        FROM public.targets
        WHERE user_name = $1
          AND status = 'Approved'
      `;
      values = [username];
    }

    const result = await pool.query(query, values);
    const row = result.rows[0] || {};

    const payload = {
      total_deposit: Number(row.total_deposit) || 0,
      total_fcy: Number(row.total_fcy) || 0,
      total_loan: Number(row.total_loan) || 0,
    };

    // District Directors don't set loan targets themselves — the Area Managers
    // under their district do. If the DD's own row has no loan target, use the
    // sum of his/her district's AMs' approved loan targets.
    if (isOwnDistrict && subprocess && !payload.total_loan) {
      const amLoanSumQuery = `
        SELECT SUM(x.loan_target) AS total_loan
        FROM (
          SELECT u.id, SUM(COALESCE(t.loan_collection, 0)) AS loan_target
          FROM public.targets t
          INNER JOIN public.users u ON u.user_name = t.user_name
          WHERE u.title = 'Area Manager'
            AND t.status = 'Approved'
          GROUP BY u.id
        ) x
        INNER JOIN (
          SELECT DISTINCT amb.area_manager_user_id, b.subprocess_id
          FROM public.area_manager_branch_mapping amb
          INNER JOIN public.branches b ON b.id = amb.branch_id
        ) m ON m.area_manager_user_id = x.id
        INNER JOIN public.sub_processess sp ON sp.subprocess_id = m.subprocess_id
        WHERE sp.subprocess_name = $1
      `;
      const amLoanSumRes = await pool.query(amLoanSumQuery, [subprocess]);
      const amLoan = Number(amLoanSumRes.rows[0]?.total_loan) || 0;
      if (amLoan > 0) {
        payload.total_loan = amLoan;
      }
    }

    // ── Per-district targets (enterprise / all-districts views) ──────────────
    // District Director target rows grouped by the district in users.subprocess.
    if (isEnterprise) {
      const districtQuery = `
        SELECT
          u.subprocess AS district_name,
          SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
          SUM(COALESCE(t.fcy_target, 0))     AS fcy_target
        FROM public.targets t
        INNER JOIN public.users u ON t.user_name = u.user_name
        WHERE u.title ILIKE 'Director%District'
          AND t.status = 'Approved'
        GROUP BY u.subprocess
      `;
      const districtRes = await pool.query(districtQuery);
      const districtRows = districtRes.rows.map((r) => ({
        district_name: r.district_name,
        deposit_target: Number(r.deposit_target) || 0,
        fcy_target: Number(r.fcy_target) || 0,
        loan_target: 0,
      }));

      // Districts' loan targets: District Directors do not set loan targets —
      // the Area Managers under each district do. Sum each district's AMs'
      // approved loan_collection rows (pre-aggregated per AM so the branch
      // mappings don't multiply the target).
      const districtLoanQuery = `
        SELECT sp.subprocess_name AS district_name,
               SUM(x.loan_target) AS loan_target
        FROM (
          SELECT u.id, SUM(COALESCE(t.loan_collection, 0)) AS loan_target
          FROM public.targets t
          INNER JOIN public.users u ON u.user_name = t.user_name
          WHERE u.title = 'Area Manager'
            AND t.status = 'Approved'
          GROUP BY u.id
        ) x
        INNER JOIN (
          SELECT DISTINCT amb.area_manager_user_id, b.subprocess_id
          FROM public.area_manager_branch_mapping amb
          INNER JOIN public.branches b ON b.id = amb.branch_id
        ) m ON m.area_manager_user_id = x.id
        INNER JOIN public.sub_processess sp ON sp.subprocess_id = m.subprocess_id
        GROUP BY sp.subprocess_name
      `;
      const districtLoanRes = await pool.query(districtLoanQuery);
      const loanByDistrict = {};
      districtLoanRes.rows.forEach((r) => {
        loanByDistrict[r.district_name] = Number(r.loan_target) || 0;
      });
      const districtByName = {};
      districtRows.forEach((r) => { districtByName[r.district_name] = r; });
      Object.keys(loanByDistrict).forEach((name) => {
        if (!districtByName[name]) {
          const row = { district_name: name, deposit_target: 0, fcy_target: 0, loan_target: 0 };
          districtByName[name] = row;
          districtRows.push(row);
        }
      });
      districtRows.forEach((r) => { r.loan_target = loanByDistrict[r.district_name] || 0; });

      // Districts with no District Director target and no Area Managers
      // (e.g. relationship-office districts) fall back to the summed
      // Branch Manager targets of the branches under them — per metric,
      // so only the missing values are filled.
      const branchDistrictQuery = `
        SELECT sp.subprocess_name AS district_name,
               SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
               SUM(COALESCE(t.fcy_target, 0))     AS fcy_target,
               SUM(COALESCE(t.loan_collection, 0)) AS loan_target
        FROM public.targets t
        INNER JOIN public.users u ON u.user_name = t.user_name
        INNER JOIN public.branches b ON b.branch_code = u.company_code
        INNER JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        WHERE u.title ILIKE 'Branch Manager%'
          AND t.status = 'Approved'
          AND b.branch_code IS NOT NULL AND b.branch_code <> ''
        GROUP BY sp.subprocess_name
      `;
      const branchDistrictRes = await pool.query(branchDistrictQuery);
      const branchTargetsByDistrict = {};
      branchDistrictRes.rows.forEach((r) => {
        branchTargetsByDistrict[r.district_name] = {
          deposit_target: Number(r.deposit_target) || 0,
          fcy_target: Number(r.fcy_target) || 0,
          loan_target: Number(r.loan_target) || 0,
        };
      });
      Object.keys(branchTargetsByDistrict).forEach((name) => {
        if (!districtByName[name]) {
          const row = { district_name: name, deposit_target: 0, fcy_target: 0, loan_target: 0 };
          districtByName[name] = row;
          districtRows.push(row);
        }
      });
      districtRows.forEach((r) => {
        const bt = branchTargetsByDistrict[r.district_name];
        if (!bt) return;
        if (!r.deposit_target) r.deposit_target = bt.deposit_target;
        if (!r.fcy_target) r.fcy_target = bt.fcy_target;
        if (!r.loan_target) r.loan_target = bt.loan_target;
      });
      payload.districtTargets = districtRows;
      // Bank-level totals track the district rows so the KPI cards stay
      // consistent with the district aggregate card
      payload.total_deposit = districtRows.reduce((s, r) => s + r.deposit_target, 0);
      payload.total_fcy = districtRows.reduce((s, r) => s + r.fcy_target, 0);
      payload.total_loan = districtRows.reduce((s, r) => s + r.loan_target, 0);

      // All branch targets bank-wide (Branch Manager target rows → branches)
      const allBranchQuery = `
        SELECT
          b.branch_code,
          b.branch_name,
          SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
          SUM(COALESCE(t.fcy_target, 0))     AS fcy_target,
          SUM(COALESCE(t.loan_collection, 0)) AS loan_target
        FROM public.targets t
        INNER JOIN public.users u ON u.user_name = t.user_name
        INNER JOIN public.branches b ON b.branch_code = u.company_code
        WHERE u.title ILIKE 'Branch Manager%'
          AND t.status = 'Approved'
          AND b.branch_code IS NOT NULL
        GROUP BY b.branch_code, b.branch_name
      `;
      const allBranchRes = await pool.query(allBranchQuery);
      payload.branchTargets = allBranchRes.rows.map((r) => ({
        branch_code: r.branch_code,
        branch_name: r.branch_name,
        deposit_target: Number(r.deposit_target) || 0,
        fcy_target: Number(r.fcy_target) || 0,
        loan_target: Number(r.loan_target) || 0,
      }));

      // Area Manager targets = each AM's own approved target row (it already
      // represents the combined commitment of all branches under them)
      const amTargetQuery = `
        SELECT
          u.user_name,
          SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
          SUM(COALESCE(t.fcy_target, 0))     AS fcy_target,
          SUM(COALESCE(t.loan_collection, 0)) AS loan_target
        FROM public.targets t
        INNER JOIN public.users u ON u.user_name = t.user_name
        WHERE u.title = 'Area Manager'
          AND t.status = 'Approved'
        GROUP BY u.user_name
      `;
      const amTargetRes = await pool.query(amTargetQuery);
      payload.areaManagerTargets = amTargetRes.rows.map((r) => ({
        user_name: r.user_name,
        deposit_target: Number(r.deposit_target) || 0,
        fcy_target: Number(r.fcy_target) || 0,
        loan_target: Number(r.loan_target) || 0,
      }));
    }

    // ── Per-branch targets (district / area-manager views) ───────────────────
    // Branch Manager target rows mapped to branches via users.company_code.
    if (isOwnDistrict && subprocess) {
      const branchQuery = `
        SELECT
          b.branch_code,
          b.branch_name,
          SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
          SUM(COALESCE(t.fcy_target, 0))     AS fcy_target,
          SUM(COALESCE(t.loan_collection, 0)) AS loan_target
        FROM public.targets t
        INNER JOIN public.users u ON u.user_name = t.user_name
        INNER JOIN public.branches b ON b.branch_code = u.company_code
        INNER JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
        WHERE u.title ILIKE 'Branch Manager%'
          AND sp.subprocess_name = $1
          AND t.status = 'Approved'
        GROUP BY b.branch_code, b.branch_name
      `;
      const branchRes = await pool.query(branchQuery, [subprocess]);
      payload.branchTargets = branchRes.rows.map((r) => ({
        branch_code: r.branch_code,
        branch_name: r.branch_name,
        deposit_target: Number(r.deposit_target) || 0,
        fcy_target: Number(r.fcy_target) || 0,
        loan_target: Number(r.loan_target) || 0,
      }));

      // Area Managers of this district — their own approved target rows
      // (each already covers all branches assigned to them)
      const amTargetQuery = `
        SELECT
          u.user_name,
          SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
          SUM(COALESCE(t.fcy_target, 0))     AS fcy_target,
          SUM(COALESCE(t.loan_collection, 0)) AS loan_target
        FROM public.targets t
        INNER JOIN public.users u ON u.user_name = t.user_name
        WHERE u.title = 'Area Manager'
          AND t.status = 'Approved'
          AND EXISTS (
            SELECT 1
            FROM public.area_manager_branch_mapping amb
            INNER JOIN public.branches b ON b.id = amb.branch_id
            INNER JOIN public.sub_processess sp ON sp.subprocess_id = b.subprocess_id
            WHERE amb.area_manager_user_id = u.id
              AND sp.subprocess_name = $1
          )
        GROUP BY u.user_name
      `;
      const amTargetRes = await pool.query(amTargetQuery, [subprocess]);
      payload.areaManagerTargets = amTargetRes.rows.map((r) => ({
        user_name: r.user_name,
        deposit_target: Number(r.deposit_target) || 0,
        fcy_target: Number(r.fcy_target) || 0,
        loan_target: Number(r.loan_target) || 0,
      }));
    } else if (isAreaManager) {
      const branchQuery = `
        SELECT
          b.branch_code,
          b.branch_name,
          SUM(COALESCE(t.deposit_target, 0)) AS deposit_target,
          SUM(COALESCE(t.fcy_target, 0))     AS fcy_target,
          SUM(COALESCE(t.loan_collection, 0)) AS loan_target
        FROM public.targets t
        INNER JOIN public.users u ON u.user_name = t.user_name
        INNER JOIN public.branches b ON b.branch_code = u.company_code
        INNER JOIN public.area_manager_branch_mapping amb ON amb.branch_id = b.id
        INNER JOIN public.users amu ON amu.id = amb.area_manager_user_id
        WHERE u.title ILIKE 'Branch Manager%'
          AND amu.user_name = $1
          AND t.status = 'Approved'
        GROUP BY b.branch_code, b.branch_name
      `;
      const branchRes = await pool.query(branchQuery, [username]);
      payload.branchTargets = branchRes.rows.map((r) => ({
        branch_code: r.branch_code,
        branch_name: r.branch_name,
        deposit_target: Number(r.deposit_target) || 0,
        fcy_target: Number(r.fcy_target) || 0,
        loan_target: Number(r.loan_target) || 0,
      }));

      // The AM's own target row ("own scope" visibility — it is already the
      // combined commitment of all assigned branches)
      payload.areaManagerTargets = [
        {
          user_name: username,
          deposit_target: payload.total_deposit,
          fcy_target: payload.total_fcy,
          loan_target: payload.total_loan,
        },
      ];
    }

    // ── Own-branch target (Branch Manager view) ──────────────────────────────
    if (title.includes("Branch Manager") && company_code) {
      payload.branchTargets = [
        {
          branch_code: company_code,
          deposit_target: payload.total_deposit,
          fcy_target: payload.total_fcy,
          loan_target: payload.total_loan,
        },
      ];
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("getMainDashboardTargets error:", err.message);
    return res.status(500).json({ error: "Server error." });
  }
};
