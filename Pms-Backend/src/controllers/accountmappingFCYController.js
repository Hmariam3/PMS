import pool from "../db.js";
import XLSX from "xlsx";
import { fetchAccountBalanceFromSoap } from "./accountSoapController.js";


// ✅ Get all account mappings
export const getAllAccountMappings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        map_id, account_number, account_holder, 
        beginning_balance, current_balance, 
        user_name, created_at,
        process, subprocess, team,
        district, branch, customer_id, crm_name
       FROM public.accountmappingfcy
       ORDER BY map_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get account mappings by user
export const getAccountMappingsByUser = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_name is required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        map_id, account_number, account_holder, 
        beginning_balance, current_balance, 
        user_name, created_at,
        process, subprocess, team,
        district, branch, customer_id, crm_name
       FROM public.accountmappingfcy
       WHERE user_name = $1
       ORDER BY map_id`,
      [user_id],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get single account mapping by ID
export const getAccountMappingById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        map_id, account_number, account_holder, 
        beginning_balance, current_balance, 
        user_name, created_at,
        process, subprocess, team,
        district, branch, customer_id, crm_name
       FROM public.accountmappingfcy
       WHERE map_id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Account mapping not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create new account mapping
export const createAccountMapping = async (req, res) => {
  const {
    account_number,
    account_holder,
    beginning_balance,
    current_balance,
    user_name,
    process,
    subprocess,
    team,
    district,
    branch,
    customer_id,
    crm_name,
  } = req.body;

  const cleaned_account_number = account_number?.trim();
  if (!account_number || !account_holder) {
    return res.status(400).json({
      message: "account_number and account_holder are required",
    });
  }

  try {
    //  Check duplicate
    const check = await pool.query(
      `SELECT 1 FROM public.accountmappingfcy WHERE account_number = $1 LIMIT 1`,
      [cleaned_account_number],
    );

    if (check.rows.length > 0) {
      return res.status(409).json({
        message: "Account is already registered",
      });
    }

    //  Insert
    const result = await pool.query(
      `INSERT INTO public.accountmappingfcy 
       (account_number, account_holder, beginning_balance, current_balance, user_name, created_at,
        process, subprocess, team, district, branch, customer_id, crm_name)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        cleaned_account_number,
        account_holder,
        beginning_balance || 0,
        current_balance || 0,
        user_name || "system",
        process,
        subprocess,
        team,
        district,
        branch,
        customer_id,
        crm_name,
      ],
    );

    res.status(201).json({
      message: "Account mapping created",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update account mapping
export const updateAccountMapping = async (req, res) => {
  const { id } = req.params;

  const {
    account_number,
    account_holder,
    beginning_balance,
    current_balance,
    user_name,
    process,
    subprocess,
    team,
    district,
    branch,
    customer_id,
    crm_name,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.accountmappingfcy
       SET account_number = $1,
           account_holder = $2,
           beginning_balance = $3,
           current_balance = $4,
           user_name = $5,
           process = $6,
           subprocess = $7,
           team = $8,
           district = $9,
           branch = $10,
           customer_id = $11,
           crm_name = $12
       WHERE map_id = $13
       RETURNING *`,
      [
        account_number,
        account_holder,
        beginning_balance || 0,
        current_balance || 0,
        user_name || "system",
        process,
        subprocess,
        team,
        district,
        branch,
        customer_id,
        crm_name,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Account mapping not found" });
    }

    res.status(200).json({
      message: "Account mapping updated",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

//  Delete account mapping
export const deleteAccountMapping = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.accountmappingfcy
       WHERE map_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Account mapping not found" });
    }

    res.status(200).json({
      message: "Account mapping deleted",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFcyAccountMappingsByUser = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_name is required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        map_id, account_number, account_holder, 
        beginning_balance, current_balance, 
        user_name, created_at,
        process, subprocess, team,
        district, branch, customer_id, crm_name
       FROM public.accountmappingfcy
       WHERE user_name = $1
       ORDER BY map_id`,
      [user_id],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// Get balance difference by user role
export const getBalanceDifferenceByUser = async (req, res) => {
  const { user_id, position, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values;

    if (position === "CRM") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE user_name = $1
      `;
      values = [user_id];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE subprocess = $1
      `;
      values = [subprocess];
    } else if (position === "VP") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
        WHERE process = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmappingfcy
      `;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_difference: result.rows[0].total_difference || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// ✅ Import Excel for FCY Account Mapping
export const importExcelAccountMappingFCY = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { user_name, process, subprocess, team } = req.body;
  if (!user_name) {
    return res.status(400).json({ message: "User name is required" });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    // Limit to 50 accounts
    const limitedDataRaw = data.slice(0, 50);
    const uniqueAccounts = new Set();
    const limitedData = [];
    const duplicatesInExcel = [];

    for (const row of limitedDataRaw) {
      const accountNumber = String(row["account_number"] || row["Account Number"] || "").trim();
      if (accountNumber) {
        if (!uniqueAccounts.has(accountNumber)) {
          uniqueAccounts.add(accountNumber);
          limitedData.push(row);
        } else {
          duplicatesInExcel.push({
            account: accountNumber,
            reason: "Duplicate in the uploaded Excel file",
          });
        }
      } else {
        limitedData.push(row);
      }
    }

    const results = {
      success: [],
      skipped: [...duplicatesInExcel],
      errors: [],
    };

    const chunkArray = (arr, size) => {
      return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );
    };

    const batches = chunkArray(limitedData, 5);

    for (const batch of batches) {
      await Promise.all(batch.map(async (row) => {
        const accountNumber = String(row["account_number"] || row["Account Number"] || "").trim();

        if (!accountNumber) {
          results.errors.push({ account: "Unknown", error: "Empty account number" });
          return;
        }

        if (accountNumber.length < 8) {
          results.errors.push({ account: accountNumber, error: "Account must be at least 8 digits" });
          return;
        }

        try {
          // 1. Check duplicate in DB
          const check = await pool.query(
            `SELECT 1 FROM public.accountmappingfcy WHERE account_number = $1 LIMIT 1`,
            [accountNumber]
          );
          if (check.rows.length > 0) {
            results.skipped.push({ account: accountNumber, reason: "Already registered" });
            return;
          }

          // 2. Fetch from Temenos
          const soapData = await fetchAccountBalanceFromSoap(accountNumber);

          // 3. Validation
          if (soapData.currency === "ETB") {
            results.errors.push({ account: accountNumber, error: "ETB accounts not allowed for FCY" });
            return;
          }

          // 4. Fetch Branch Info
          let district = "";
          let branch = "";
          if (soapData.campany_code) {
            const branchRes = await pool.query(
              `SELECT b.branch_name, s.process_name 
               FROM public.branches b
               JOIN public.sub_processess s ON b.subprocess_id = s.id
               WHERE b.branch_code = $1`,
              [soapData.campany_code]
            );
            if (branchRes.rows.length > 0) {
              branch = branchRes.rows[0].branch_name;
              district = branchRes.rows[0].process_name;
            }
          }

          // 5. Insert to DB
          await pool.query(
            `INSERT INTO public.accountmappingfcy 
             (account_number, account_holder, beginning_balance, current_balance, user_name, created_at,
              process, subprocess, team, district, branch, customer_id, crm_name)
             VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12)`,
            [
              accountNumber,
              soapData.name,
              parseFloat(String(soapData.workingBalance).replace(/,/g, "")) || 0,
              parseFloat(String(soapData.workingBalance).replace(/,/g, "")) || 0,
              user_name,
              process || null,
              subprocess || null,
              team || null,
              district,
              branch,
              soapData.customer_id,
              user_name,
            ]
          );

          results.success.push({ account: accountNumber, holder: soapData.name });

        } catch (err) {
          console.error(`Error processing account ${accountNumber}:`, err.message);
          results.errors.push({ account: accountNumber, error: err.message });
        }
      }));
    }

    res.status(200).json({
      message: "Bulk upload completed",
      summary: {
        total: limitedDataRaw.length,
        successCount: results.success.length,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length,
      },
      results,
    });

  } catch (err) {
    console.error("Bulk upload error:", err.message);
    res.status(500).json({ error: "Failed to process bulk upload" });
  }
};
