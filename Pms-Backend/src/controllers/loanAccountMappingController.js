import pool from "../db.js";
import XLSX from "xlsx";
import { fetchAccountBalanceFromSoap, fetchLoanDetailFromSoap } from "./accountSoapController.js";

// ✅ Get all loan account mappings
export const getAllLoanAccountMappings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        map_id, loan_account_number, account_holder, 
        collected_balance, outstanding_balance, status,
        user_name, created_at,
        process, subprocess, team,
        district, branch, customer_id, crm_name
       FROM public.loanaccountmapping
       ORDER BY map_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get loan account mappings by user
export const getLoanAccountMappingsByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({ error: "User ID and position are required" });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `SELECT * FROM public.loanaccountmapping WHERE user_name = $1 ORDER BY map_id`;
      values = [user_id];
    } else if (position === "Manager") {
      query = `SELECT * FROM public.loanaccountmapping WHERE team = $1 ORDER BY map_id`;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `SELECT * FROM public.loanaccountmapping WHERE subprocess = $1 ORDER BY map_id`;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `SELECT * FROM public.loanaccountmapping WHERE process = $1 ORDER BY map_id`;
      values = [process];
    } else if (position === "CEO") {
      query = `SELECT * FROM public.loanaccountmapping ORDER BY map_id`;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get single loan account mapping by ID
export const getLoanAccountMappingById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM public.loanaccountmapping WHERE map_id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Loan account mapping not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create new loan account mapping
export const createLoanAccountMapping = async (req, res) => {
  const {
    loan_account_number,
    account_holder,
    collected_balance,
    outstanding_balance,
    status,
    user_name,
    process,
    subprocess,
    team,
    district,
    branch,
    customer_id,
    crm_name,
  } = req.body;

  const cleaned_account_number = loan_account_number?.trim();
  if (!loan_account_number || !account_holder) {
    return res.status(400).json({
      message: "loan_account_number and account_holder are required",
    });
  }

  try {
    // Check duplicate
    const check = await pool.query(
      `SELECT 1 FROM public.loanaccountmapping WHERE loan_account_number = $1 LIMIT 1`,
      [cleaned_account_number],
    );

    if (check.rows.length > 0) {
      return res.status(409).json({
        message: "Loan account is already registered",
      });
    }

    // Insert
    const result = await pool.query(
      `INSERT INTO public.loanaccountmapping 
       (loan_account_number, account_holder, collected_balance, outstanding_balance, status, user_name, created_at,
        process, subprocess, team, district, branch, customer_id, crm_name)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        cleaned_account_number,
        account_holder,
        collected_balance || 0,
        outstanding_balance || 0,
        status || 'Active',
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
      message: "Loan account mapping created",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update loan account mapping
export const updateLoanAccountMapping = async (req, res) => {
  const { id } = req.params;
  const {
    loan_account_number,
    account_holder,
    collected_balance,
    outstanding_balance,
    status,
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
      `UPDATE public.loanaccountmapping
       SET loan_account_number = $1,
           account_holder = $2,
           collected_balance = $3,
           outstanding_balance = $4,
           status = $5,
           user_name = $6,
           process = $7,
           subprocess = $8,
           team = $9,
           district = $10,
           branch = $11,
           customer_id = $12,
           crm_name = $13
       WHERE map_id = $14
       RETURNING *`,
      [
        loan_account_number,
        account_holder,
        collected_balance || 0,
        outstanding_balance || 0,
        status,
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
      return res.status(404).json({ message: "Loan account mapping not found" });
    }

    res.status(200).json({
      message: "Loan account mapping updated",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete loan account mapping
export const deleteLoanAccountMapping = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.loanaccountmapping
       WHERE map_id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Loan account mapping not found" });
    }

    res.status(200).json({
      message: "Loan account mapping deleted",
      mapping: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get balance difference for Loans
export const getLoanBalanceDifferenceByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;
  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT 
          SUM(COALESCE(collected_balance, 0)) AS total_difference
        FROM public.loanaccountmapping
        WHERE user_name = $1
      `;
      values = [user_id];
    } else if (position === "Manager") {
      query = `
        SELECT 
          SUM(COALESCE(collected_balance, 0)) AS total_difference
        FROM public.loanaccountmapping
        WHERE team = $1
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          SUM(COALESCE(collected_balance, 0)) AS total_difference
        FROM public.loanaccountmapping
        WHERE subprocess = $1
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          SUM(COALESCE(collected_balance, 0)) AS total_difference
        FROM public.loanaccountmapping
        WHERE process = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(COALESCE(collected_balance, 0)) AS total_difference
        FROM public.loanaccountmapping
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

// ✅ Import Excel for Loan Account Mapping
export const importExcelLoanAccountMapping = async (req, res) => {
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

    const limitedDataRaw = data.slice(0, 50);
    const uniqueAccounts = new Set();
    const limitedData = [];
    const duplicatesInExcel = [];

    for (const row of limitedDataRaw) {
      const accountNumber = String(row["loan_account_number"] || row["Loan Account Number"] || row["account_number"] || "").trim();
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

    for (const row of limitedData) {
      const accountNumber = String(row["loan_account_number"] || row["Loan Account Number"] || row["account_number"] || "").trim();

      if (!accountNumber) {
        results.errors.push({ account: "Unknown", error: "Empty account number" });
        continue;
      }

      try {
        // 1. Check duplicate
        const check = await pool.query(
          `SELECT 1 FROM public.loanaccountmapping WHERE loan_account_number = $1 LIMIT 1`,
          [accountNumber]
        );
        if (check.rows.length > 0) {
          results.skipped.push({ account: accountNumber, reason: "Already registered" });
          continue;
        }

        // 2. Fetch from SOAP (using specialized loan SOAP)
        const soapData = await fetchLoanDetailFromSoap(accountNumber);

        // 3. Fetch Branch Info
        let district = "";
        let branch = "";
        if (soapData.companycode) {
          const branchRes = await pool.query(
            `SELECT b.branch_name, s.subprocess_name 
             FROM public.branches b
             JOIN public.sub_processess s ON b.subprocess_id = s.subprocess_id
             WHERE b.branch_code = $1`,
            [soapData.companycode]
          );
          if (branchRes.rows.length > 0) {
            branch = branchRes.rows[0].branch_name;
            district = branchRes.rows[0].subprocess_name;
          }
        }

        // 4. Insert to DB
        await pool.query(
          `INSERT INTO public.loanaccountmapping 
           (loan_account_number, account_holder, collected_balance, outstanding_balance, status, user_name, created_at,
            process, subprocess, team, district, branch, customer_id, crm_name)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12, $13)`,
          [
            accountNumber,
            soapData.customerName,
            parseFloat(String(soapData.amount).replace(/,/g, "")) || 0, // Mapping original loan amount
            parseFloat(String(soapData.outstandingAmount || soapData.outstandingBalance).replace(/,/g, "")) || 0, // Accurate outstanding balance
            soapData.status,
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

        results.success.push({ account: accountNumber, holder: soapData.customerName });

      } catch (err) {
        results.errors.push({ account: accountNumber, error: err.message });
      }
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


// ✅ Get Outstanding Balance for Loans
export const getLoanOutstandingBalanceByUser = async (req, res) => {
  const { user_id, position, team, subprocess, process } = req.body;
  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE user_name = $1
      `;
      values = [user_id];
    } else if (position === "Manager") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE team = $1
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE subprocess = $1
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE process = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
      `;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_balance: result.rows[0].total_balance || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get Special Mention Outstanding Balance for Loans
export const getSpecialMentionLoanSumBalanceByUser = async (req, res) => {

  const { user_id, position, team, subprocess, process } = req.body;
  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let values;

    if (position === "CRM" || position === "Individual") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE user_name = $1 AND status = 'SME'
      `;
      values = [user_id];
    } else if (position === "Manager") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE team = $1 AND status = 'SME'
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE subprocess = $1 AND status = 'SME'
      `;
      values = [subprocess];
    } else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE process = $1 AND status = 'SME'
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(ABS(COALESCE(outstanding_balance, 0))) AS total_balance
        FROM public.loanaccountmapping
        WHERE status = 'SME'
      `;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      total_balance: result.rows[0].total_balance || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};