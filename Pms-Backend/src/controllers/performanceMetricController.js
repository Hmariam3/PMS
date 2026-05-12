import pool from "../db.js";

// Get all performance metrics
export const getMetrics = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          pm.metric_id,
          pm.objective_id,
          pm.metric_name,
          pm.measurement_formula,
          pm.metric_weight,
          pm.unit_of_measure,
          pm.evaluation_frequency,
          pm.target_fy,
          pm.created_date,
          pm.updated_date,
          pm.evaluator_input,
          pm.dividerormultplid,
          pm.operation,
          pm.input_by,
          pm.calculated_for,
          pm.calculated_with,
          o.objective_name,
          t.title_name
       FROM public.performance_metrics pm
       INNER JOIN public.objectives o
         ON pm.objective_id = o.objective_id
       INNER JOIN public.titles t
         ON o.title_id = t.id
       ORDER BY pm.metric_id ASC`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single metric by ID
export const getMetricById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT metric_id, objective_id, metric_name, measurement_formula, metric_weight, 
              unit_of_measure, evaluation_frequency, target_fy, created_date, updated_date,
              evaluator_input, dividerormultplid, operation,created_by,updated_by
       FROM public.performance_metrics
       WHERE metric_id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Metric not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new performance metric
export const createMetric = async (req, res) => {
  const {
    objective_id,
    metric_name,
    measurement_formula,
    metric_weight,
    unit_of_measure,
    evaluation_frequency,
    target_fy,
    evaluator_input,
    dividerormultplid,
    operation,
    created_by,
    input_by,
    calculated_for,
    calculated_with,
  } = req.body;

  if (!objective_id || !metric_name) {
    return res
      .status(400)
      .json({ message: "objective_id and metric_name are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.performance_metrics
        (objective_id, metric_name, measurement_formula, metric_weight, unit_of_measure, evaluation_frequency, target_fy, created_date, updated_date, evaluator_input, dividerormultplid, operation,created_by, input_by,
    calculated_for,calculated_with)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10,$11,$12,$13,$14)
       RETURNING *`,
      [
        objective_id,
        metric_name,
        measurement_formula || "",
        metric_weight || 0,
        unit_of_measure || "",
        evaluation_frequency || "",
        target_fy || 0,
        evaluator_input || "",
        Number(dividerormultplid) || 1,
        operation || "",
        created_by,
        input_by,
        calculated_for,
        calculated_with,
      ],
    );

    res.status(201).json({
      message: "Performance metric created",
      metric: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a performance metric
export const updateMetric = async (req, res) => {
  const { id } = req.params;
  const {
    objective_id,
    metric_name,
    measurement_formula,
    metric_weight,
    unit_of_measure,
    evaluation_frequency,
    target_fy,
    evaluator_input,
    dividerormultplid,
    operation,
    updated_by,
    input_by,
    calculated_for,
    calculated_with,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.performance_metrics
       SET objective_id = $1,
           metric_name = $2,
           measurement_formula = $3,
           metric_weight = $4,
           unit_of_measure = $5,
           evaluation_frequency = $6,
           target_fy = $7,
           updated_date = NOW(),
           evaluator_input = $8,
           dividerormultplid = $9,
           operation = $10,
           updated_by = $11,
            input_by=$12,
          calculated_for=$13,
          calculated_with=$14

       WHERE metric_id = $15
       RETURNING *`,
      [
        objective_id,
        metric_name,
        measurement_formula || "",
        metric_weight || 0,
        unit_of_measure || "",
        evaluation_frequency || "",
        target_fy || 0,
        evaluator_input || "",
        Number(dividerormultplid) || 1,
        operation || "",
        updated_by,
        input_by,
        calculated_for,
        calculated_with,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Metric not found" });
    }

    res.status(200).json({
      message: "Performance metric updated",
      metric: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a performance metric
export const deleteMetric = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM public.performance_metrics WHERE metric_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Metric not found" });
    }

    res.status(200).json({
      message: "Performance metric deleted",
      metric: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get metrics by title_id
export const getMetricsByTitle = async (req, res) => {
  const { title_id, branch_grade } = req.params;
  try {
    if (!title_id || !branch_grade) {
      return res.status(400).json({
        error: "title_id and branch_grade are required",
      });
    }
    const result = await pool.query(
      `SELECT 
          pm.metric_id,
          pm.objective_id,
          pm.metric_name,
          pm.measurement_formula,
          pm.metric_weight,
          pm.unit_of_measure,
          pm.evaluation_frequency,
          pm.target_fy,
          pm.created_date,
          pm.updated_date,
          pm.evaluator_input,
          pm.dividerormultplid,
          pm.operation,
          o.title_id,
          o.objective_name,
          o.grade
       FROM public.performance_metrics pm
       INNER JOIN public.objectives o
         ON pm.objective_id = o.objective_id
       WHERE o.title_id = $1  AND   o.grade=$2
       ORDER BY pm.metric_id ASC`,
      [title_id, branch_grade],
    );
    // console.log("result", result);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: "No data found",
      });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get metrics by title_name
export const getMetricsByTitleName = async (req, res) => {
  const { title_name } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
          pm.metric_id,
          pm.objective_id,
          pm.metric_name,
          pm.measurement_formula,
          pm.metric_weight,
          pm.unit_of_measure,
          pm.evaluation_frequency,
          pm.target_fy,
          pm.created_date,
          pm.updated_date,
          pm.evaluator_input,
          pm.dividerormultplid,
          pm.operation,
          pm.input_by,
          pm.calculated_for,
          pm.calculated_with,
          o.objective_name,
          t.title_name
       FROM public.performance_metrics pm
       INNER JOIN public.objectives o
         ON pm.objective_id = o.objective_id
       INNER JOIN public.titles t
         ON o.title_id = t.id
       WHERE t.title_name = $1
       ORDER BY pm.metric_id ASC`,
      [title_name],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
