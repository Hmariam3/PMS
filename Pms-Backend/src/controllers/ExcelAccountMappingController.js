import pool from "../db.js";
import xlsx from "xlsx";

export const importExcel = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    //  Get from frontend (form-data)
    const { user_name, process, subprocess, team } = req.body;
    if (!user_name || !process || !subprocess || !team) {
      return res.status(400).json({
        message: "user_name, process, subprocess, and team are required",
      });
    }

    // Read Excel
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      // Optional: prevent duplicate accounts
      const check = await pool.query(
        `SELECT 1 FROM public.accountmapping WHERE account_number = $1 LIMIT 1`,
        [row["Account"]],
      );

      if (check.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO public.accountmapping 
        (account_number, account_holder, customer_id, crm_name, district, branch,
         user_name, process, subprocess, team, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
        [
          row["Account"],
          row["Customer Name"],
          row["Customer ID"],
          row["CRM NAME"],
          row["District"],
          row["Branch"],
          user_name, //  from frontend
          process,
          subprocess,
          team,
        ],
      );
    }

    res.status(200).json({ message: "Excel imported successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Import failed" });
  }
};
