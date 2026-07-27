import pool from "../db.js";

// Get all evaluations
export const getEvaluations = async (req, res) => {
  const { user_id, position } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "user_id and position are required",
    });
  }

  try {
    let query;
    let values;

    // CRM & Individual -> evaluated
    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT 
            pe.evaluation_id,
            pe.metric_id,
            pe.weight,
            pe.evaluator,
            pe.evaluated,
            pe.employee_id,
            pe.process,
            pe.subprocess,
            pe.branch,
            pe.evaluation_value,
            pe.evaluation_date,
            pe.created_at,
            pe.updated_at,
            pe.created_by,
            pe.updated_by,
            pe.status,
            pm.metric_name,
            pm.metric_weight,
            u.full_name as evaluated_full_name
        FROM public.performance_evaluations pe
        JOIN public.performance_metrics pm 
          ON pe.metric_id = pm.metric_id
        LEFT JOIN public.users u
          ON pe.evaluated = u.mail_address
        WHERE pe.evaluated = $1
        ORDER BY pe.evaluation_id ASC
      `;

      values = [user_id];
    } else {
      // Others -> evaluator
      query = `
        SELECT 
            pe.evaluation_id,
            pe.metric_id,
            pe.weight,
            pe.evaluator,
            pe.evaluated,
            pe.employee_id,
            pe.process,
            pe.subprocess,
            pe.branch,
            pe.evaluation_value,
            pe.evaluation_date,
            pe.created_at,
            pe.updated_at,
            pe.created_by,
            pe.updated_by,
            pe.status,
            pm.metric_name,
            pm.metric_weight,
            u.full_name as evaluated_full_name
        FROM public.performance_evaluations pe
        JOIN public.performance_metrics pm 
          ON pe.metric_id = pm.metric_id
        LEFT JOIN public.users u
          ON pe.evaluated = u.mail_address
        WHERE pe.evaluator = $1
        ORDER BY pe.evaluation_id ASC
      `;

      values = [user_id];
    }

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: "Server error",
    });
  }
};

// Create new evaluation
export const createEvaluation = async (req, res) => {
  const {
    metric_id,
    evaluator,
    evaluated,
    employee_id,
    process,
    subprocess,
    branch,
    evaluation_value,
    weight,
    created_by,
    updated_by,
    outlook_address,
  } = req.body;

  if (!metric_id || !evaluator || evaluation_value === undefined) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    // ✅ CHECK EXISTING RECORD
    const existing = await pool.query(
      `SELECT 1 FROM public.performance_evaluations
       WHERE metric_id = $1 AND evaluated = $2`,
      [metric_id, evaluated],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Already evaluated for this metric",
      });
    }

    // ✅ INSERT NEW RECORD
    const result = await pool.query(
      `INSERT INTO public.performance_evaluations
        (metric_id, weight, evaluator, evaluated, employee_id, process, subprocess, branch, evaluation_value, evaluation_date, created_at, updated_at, created_by, updated_by,outlook_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW(), $10, $11,$12)
       RETURNING *`,
      [
        metric_id,
        weight || 0,
        evaluator,
        evaluated,
        employee_id,
        process,
        subprocess,
        branch,
        evaluation_value,
        created_by || null,
        updated_by || null,
        outlook_address || null,
      ],
    );

    return res
      .status(201)
      .json({ message: "Evaluation added", evaluation: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// Update evaluation
export const updateEvaluation = async (req, res) => {
  const { id } = req.params;
  const {
    evaluator,
    evaluated,
    employee_id,
    process,
    subprocess,
    branch,
    evaluation_value,
    weight,
    updated_by,
    calculated_score,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.performance_evaluations
       SET evaluator = $1,
           evaluated = $2,
           employee_id = $3,
           process = $4,
           subprocess = $5,
           branch = $6,
           evaluation_value = $7,
           weight = $8,
           calculated_score = $9,
           updated_at = NOW(),
           updated_by = $10
       WHERE evaluation_id = $11
       RETURNING *`,
      [
        evaluator,
        evaluated,
        employee_id,
        process,
        subprocess,
        branch,
        evaluation_value,
        weight,
        calculated_score || null,
        updated_by || null,
        id,
      ],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Evaluation not found" });

    res
      .status(200)
      .json({ message: "Evaluation updated", evaluation: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete evaluation
export const deleteEvaluation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.performance_evaluations 
       WHERE evaluation_id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Evaluation not found" });

    res
      .status(200)
      .json({ message: "Evaluation deleted", evaluation: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// Get weighted evaluation per objective for a user
export const getEvaluationsByUserObjective = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
          pe.evaluated AS user_id,
          o.objective_id,
          o.objective_name,
          o.objective_weight,
          SUM(pe.weight) AS total_objective_score,
          ROUND(SUM(pe.weight) * (o.objective_weight / 100), 2) AS relative_objective_score
       FROM public.performance_evaluations pe
       JOIN public.performance_metrics pm 
         ON pe.metric_id = pm.metric_id
       JOIN public.objectives o
         ON pm.objective_id = o.objective_id
       WHERE pe.evaluated = $1
       GROUP BY pe.evaluated, o.objective_id, o.objective_name, o.objective_weight
       ORDER BY o.objective_id ASC`,
      [userId],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET evaluations by evaluator
export const getEvaluationsByEvaluator = async (req, res) => {
  const { evaluator } = req.body;

  if (!evaluator) {
    return res.status(400).json({
      error: "Evaluator is required",
    });
  }
  try {
    const query = `
      SELECT DISTINCT ON (evaluated)
        pe.*,
        u.full_name as evaluated_full_name,
        u.title,
        u.position
      FROM public.performance_evaluations pe
      INNER JOIN public.users u ON pe.evaluated = u.mail_address
      WHERE pe.evaluator = $1
      ORDER BY evaluated, pe.evaluation_date DESC;
    `;
    const result = await pool.query(query, [evaluator]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching evaluations:", err.message);

    res.status(500).json({
      error: "Server error",
    });
  }
};
export const getByEvaluatedUser = async (req, res) => {
  const { evaluated, evaluator } = req.body;

  try {
    let query = `
      SELECT 
        pe.*,
        pm.metric_name,
        pm.metric_weight,
        pm.cap,
        o.objective_name,
        o.objective_weight,
        u.full_name as evaluator_full_name,
        u.title,
        u.position
      FROM public.performance_evaluations pe
      INNER JOIN public.performance_metrics pm
        ON pe.metric_id = pm.metric_id
      INNER JOIN public.objectives o
        ON pm.objective_id = o.objective_id
      LEFT JOIN public.users u
        ON pe.evaluator = u.mail_address
      WHERE pe.evaluated = $1
    `;
    const params = [evaluated];

    if (evaluator) {
      query += ` AND pe.evaluator = $2`;
      params.push(evaluator);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Agree on evaluation
export const agreeEvaluation = async (req, res) => {
  const {
    username,
    fullname,
    mail,
    employee_id,
    process,
    subprocess,
    branch,
    performance_result,
    performance_status,
    strategic_recommendation,
    created_by
  } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT title, position FROM public.users WHERE mail_address = $1`,
      [mail]
    );
    const title = userResult.rows[0]?.title || null;
    const position = userResult.rows[0]?.position || null;

    await pool.query(
      `INSERT INTO public.employee_evaluation_result (
        username, fullname, mail, employee_id, process, subprocess, branch, title, "position", 
        performance_result, performance_status, strategic_recommendation, created_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)`,
      [
        username || mail,
        fullname,
        mail,
        employee_id,
        process,
        subprocess,
        branch,
        title,
        position,
        performance_result,
        performance_status,
        strategic_recommendation,
        created_by
      ]
    );

    await pool.query(
      `UPDATE public.performance_evaluations SET status = 'agreed' WHERE evaluated = $1`,
      [mail]
    );

    res.status(200).json({ message: "Evaluation agreed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

