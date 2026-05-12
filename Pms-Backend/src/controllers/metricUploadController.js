import pool from "../db.js";
import xlsx from "xlsx";

// 1. Download Template
export const downloadMetricTemplate = async (req, res) => {
  try {
    // We provide a template with objective names and IDs to make it easier for users
    const objectives = await pool.query(`
      SELECT o.objective_id, p.pillar_name, o.objective_name, t.title_name
      FROM objectives o
      JOIN strategic_pillars p ON o.pillar_id = p.pillar_id
      JOIN titles t ON o.title_id = t.id
    `);

    const workbook = xlsx.utils.book_new();
    
    // Sheet 1: Help/Instructions (Objectives Reference)
    const refData = objectives.rows.map(o => ({
      "Objective ID (System)": o.objective_id,
      "Pillar": o.pillar_name,
      "Objective Name": o.objective_name,
      "Job Title": o.title_name
    }));
    const refSheet = xlsx.utils.json_to_sheet(refData);
    xlsx.utils.book_append_sheet(workbook, refSheet, "Objective Reference");

    // Sheet 2: Metrics Upload Template
    const templateData = [
      {
        objective_id: "",
        metric_name: "",
        measurement_formula: "",
        metric_weight: "",
        unit_of_measure: "",
        evaluation_frequency: "Quarterly",
        target_fy: "",
        evaluator_input: "",
        dividerormultplid: "",
        operation: "",
        input_by: "",
        calculated_for: "",
        calculated_with: ""
      }
    ];
    const templateSheet = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(workbook, templateSheet, "Upload Metrics");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=metric_upload_template.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate template" });
  }
};

// 2. Upload Metrics
export const uploadMetricsFromExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { created_by } = req.body;

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames.find(n => n.includes("Upload"));
    if (!sheetName) return res.status(400).json({ message: "Invalid template format. Use 'Upload Metrics' sheet." });
    
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
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
        input_by,
        calculated_for,
        calculated_with
      } = row;

      if (!objective_id || !metric_name) {
        results.errors.push(`Row ${i + 2}: Objective ID and Metric Name are required.`);
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO public.performance_metrics 
          (objective_id, metric_name, measurement_formula, metric_weight, unit_of_measure, 
           evaluation_frequency, target_fy, evaluator_input, dividerormultplid, operation, 
           input_by, calculated_for, calculated_with, created_date, updated_date, created_by, updated_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), $14, $14)`,
          [
            objective_id,
            metric_name,
            measurement_formula || null,
            metric_weight || 0,
            unit_of_measure || null,
            evaluation_frequency || 'Quarterly',
            target_fy || 0,
            evaluator_input || null,
            dividerormultplid || null,
            operation || null,
            input_by || null,
            calculated_for || null,
            calculated_with || null,
            created_by || "system"
          ]
        );
        results.success++;
      } catch (dbErr) {
        results.errors.push(`Row ${i + 2}: ${dbErr.message}`);
      }
    }

    res.status(200).json({
      message: `Processed ${data.length} rows. ${results.success} succeeded, ${results.errors.length} failed.`,
      errors: results.errors
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during upload" });
  }
};

// 3. Automation (Pillars -> Objectives -> Metrics)
export const uploadAutomatedMetrics = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const { created_by } = req.body;

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const results = { success: 0, errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const {
        pillar_name,
        title_id,
        objective_name,
        objective_weight,
        grade,
        metric_name,
        metric_weight,
        target_fy,
        unit_of_measure,
        evaluation_frequency
      } = row;

      try {
        // 1. Get or Create Pillar
        let pillarRes = await pool.query("SELECT pillar_id FROM strategic_pillars WHERE LOWER(pillar_name) = LOWER($1)", [pillar_name]);
        let pillar_id;
        if (pillarRes.rows.length === 0) {
          const newPillar = await pool.query(
            "INSERT INTO strategic_pillars (pillar_name, created_date, updated_date, created_by) VALUES ($1, NOW(), NOW(), $2) RETURNING pillar_id",
            [pillar_name, created_by || "system"]
          );
          pillar_id = newPillar.rows[0].pillar_id;
        } else {
          pillar_id = pillarRes.rows[0].pillar_id;
        }

        // 2. Get or Create Objective
        let objRes = await pool.query(
          "SELECT objective_id FROM objectives WHERE LOWER(objective_name) = LOWER($1) AND pillar_id = $2 AND title_id = $3",
          [objective_name, pillar_id, title_id]
        );
        let objective_id;
        if (objRes.rows.length === 0) {
          const newObj = await pool.query(
            `INSERT INTO objectives (pillar_id, title_id, objective_name, objective_weight, grade, created_date, updated_date, created_by) 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6) RETURNING objective_id`,
            [pillar_id, title_id, objective_name, objective_weight || 0, grade || null, created_by || "system"]
          );
          objective_id = newObj.rows[0].objective_id;
        } else {
          objective_id = objRes.rows[0].objective_id;
        }

        // 3. Create Metric
        await pool.query(
          `INSERT INTO performance_metrics 
          (objective_id, metric_name, metric_weight, target_fy, unit_of_measure, evaluation_frequency, created_date, updated_date, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)`,
          [objective_id, metric_name, metric_weight || 0, target_fy || 0, unit_of_measure || null, evaluation_frequency || 'Quarterly', created_by || "system"]
        );

        results.success++;
      } catch (err) {
        results.errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.status(200).json({
      message: `Automation complete. ${results.success} metrics created/linked.`,
      errors: results.errors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Automation failed" });
  }
};
