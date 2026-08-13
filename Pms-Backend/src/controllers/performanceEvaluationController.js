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

    // Check if a result already exists for this user
    const existingResult = await pool.query(
      `SELECT mail FROM public.employee_evaluation_result WHERE mail = $1`,
      [mail]
    );

    if (existingResult.rows.length > 0) {
      // Update existing record to prevent duplicates
      await pool.query(
        `UPDATE public.employee_evaluation_result 
         SET performance_result = $1, 
             performance_status = $2, 
             strategic_recommendation = $3, 
             created_date = NOW(), 
             created_by = $4,
             process = $5,
             subprocess = $6,
             branch = $7,
             title = $8,
             "position" = $9
         WHERE mail = $10`,
        [
          performance_result,
          performance_status,
          strategic_recommendation,
          created_by,
          process,
          subprocess,
          branch,
          title,
          position,
          mail
        ]
      );
    } else {
      // Insert new record
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
    }

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

// Bulk agree all pending evaluations
export const bulkAgreeEvaluations = async (req, res) => {
  const { created_by } = req.body;

  try {
    // 1. Fetch all un-agreed evaluations with necessary joined fields
    const query = `
      SELECT 
        pe.*,
        pm.metric_name,
        pm.metric_weight,
        pm.cap,
        o.objective_name,
        o.objective_weight,
        u.full_name as evaluated_full_name,
        u.title as evaluated_title,
        u.position as evaluated_position
      FROM public.performance_evaluations pe
      INNER JOIN public.performance_metrics pm
        ON pe.metric_id = pm.metric_id
      INNER JOIN public.objectives o
        ON pm.objective_id = o.objective_id
      LEFT JOIN public.users u
        ON pe.evaluated = u.mail_address
      -- OPTION 1: Only calculate for employees that have at least one pending metric (Uncomment to use)
      -- WHERE pe.evaluated IN (
      --   SELECT evaluated 
      --   FROM public.performance_evaluations 
      --   WHERE status IS NULL OR status != 'agreed'
      -- )
      
      -- OPTION 2: Calculate for ALL employees regardless of status (Currently Active)
      -- No WHERE filter needed to fetch everyone.
    `;
    const result = await pool.query(query);
    const evaluationsData = result.rows;

    if (evaluationsData.length === 0) {
      return res.status(200).json({ message: "No pending evaluations to agree" });
    }

    // 2. Group by evaluated (email)
    const groupedByUser = {};
    evaluationsData.forEach(item => {
      const email = item.evaluated;
      if (!groupedByUser[email]) {
        groupedByUser[email] = {
          evaluated: email,
          fullname: item.evaluated_full_name,
          employee_id: item.employee_id,
          process: item.process,
          subprocess: item.subprocess,
          branch: item.branch,
          title: item.evaluated_title,
          position: item.evaluated_position,
          username: email,
          objectives: {}
        };
      }

      const objName = item.objective_name;
      if (!groupedByUser[email].objectives[objName]) {
        groupedByUser[email].objectives[objName] = {
          objective_name: objName,
          objective_weight: Number(item.objective_weight || 100),
          total_score: 0,
          metrics: []
        };
      }

      const score = item.cap === "cap1" ? Number(item.weight || 0)
        : item.cap === "cap4" ? (Number(item.weight || 0) * 100) / 4
        : (item.cap === "cap5" || item.cap === null) ? (Number(item.weight || 0) * 100) / 5
        : 0;

      groupedByUser[email].objectives[objName].metrics.push({ ...item, score });
      groupedByUser[email].objectives[objName].total_score += Number(item.weight || 0);
    });

    // 3. Calculate final scores and recommendations
    const updates = [];
    Object.values(groupedByUser).forEach(user => {
      // Recalculate based on metric scores like frontend
      Object.values(user.objectives).forEach(obj => {
        obj.total_score = obj.metrics.reduce((sum, metric) => sum + Number(metric.score || 0), 0);
      });

      const total_score = Object.values(user.objectives).reduce((sum, obj) => sum + obj.total_score, 0);
      const performance_status = total_score >= 80 ? "Excellent" : total_score >= 50 ? "Good" : "Need Improvement";

      // Recommendation logic
      let recommendation = "";
      if (total_score >= 85) {
        recommendation = "Sustaining Excellence: You are exceeding expectations. Focus on knowledge sharing and potentially expanding your scope of responsibility.";
      } else if (total_score >= 75) {
        recommendation = "High Potential: Great results. To push into the top tier, look for micro-optimizations in your core workflows.";
      } else {
        const lowestObj = Object.values(user.objectives).sort((a, b) => {
          const ratioA = a.total_score / (a.objective_weight || 1);
          const ratioB = b.total_score / (b.objective_weight || 1);
          return ratioA - ratioB;
        })[0];
        
        if (total_score >= 50) {
          recommendation = `Good Progress: Focus your efforts on "${lowestObj?.objective_name || 'core objectives'}" to improve your overall rating. Consistency is key here.`;
        } else {
          recommendation = `Action Required: Prioritize a deep dive into "${lowestObj?.objective_name || 'your performance metrics'}" and collaborate with your lead to resolve specific bottlenecks.`;
        }
      }

      updates.push({
        ...user,
        performance_result: total_score,
        performance_status,
        strategic_recommendation: recommendation
      });
    });

    // 4. Upsert results
    for (const u of updates) {
      const existingResult = await pool.query(
        `SELECT mail FROM public.employee_evaluation_result WHERE mail = $1`,
        [u.evaluated]
      );

      if (existingResult.rows.length > 0) {
        await pool.query(
          `UPDATE public.employee_evaluation_result 
           SET performance_result = $1, 
               performance_status = $2, 
               strategic_recommendation = $3, 
               created_date = NOW(), 
               created_by = $4,
               process = $5,
               subprocess = $6,
               branch = $7,
               title = $8,
               "position" = $9
           WHERE mail = $10`,
          [u.performance_result, u.performance_status, u.strategic_recommendation, created_by, u.process, u.subprocess, u.branch, u.title, u.position, u.evaluated]
        );
      } else {
        await pool.query(
          `INSERT INTO public.employee_evaluation_result (
            username, fullname, mail, employee_id, process, subprocess, branch, title, "position", 
            performance_result, performance_status, strategic_recommendation, created_date, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)`,
          [u.username || u.evaluated, u.fullname || u.evaluated, u.evaluated, u.employee_id, u.process, u.subprocess, u.branch, u.title, u.position, u.performance_result, u.performance_status, u.strategic_recommendation, created_by]
        );
      }
    }

    // 5. Update status
    await pool.query(
      `UPDATE public.performance_evaluations SET status = 'agreed' WHERE status IS NULL OR status != 'agreed'`
    );

    res.status(200).json({ message: `Bulk evaluation agreed successfully for ${updates.length} employees` });
  } catch (err) {
    console.error("Bulk Agree Error:", err);
    res.status(500).json({ error: "Server error during bulk agree" });
  }
};


