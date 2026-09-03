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
       FROM public.accountmapping
       ORDER BY map_id`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get account mappings by user
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
       FROM public.accountmapping
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
       FROM public.accountmapping
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
  if (!user_name) {
    return res.status(400).json({
      message: "user_name is required",
    });
  }

  try {
    // Fetch current user details
    const userRes = await pool.query(
      "SELECT organization, position FROM public.users WHERE user_name = $1",
      [user_name]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        message: `User '${user_name}' not found`,
      });
    }

    const { organization, position } = userRes.rows[0];
    const orgLower = (organization || "").toLowerCase();
    const posLower = (position || "").toLowerCase();

    // Check organization eligibility
    if (orgLower !== "branch" && orgLower !== "do" && orgLower !== "ho") {
      return res.status(403).json({
        message: "Account mapping is only allowed for users from Branch, District, or Ho organizations.",
      });
    }

    // Check position eligibility
    if ((orgLower === "do" || orgLower === "ho") && posLower !== "crm") {
      return res.status(403).json({
        message: `Users from ${organization} organization must have CRM position to register accounts.`,
      });
    }

    // Check duplicate account in the same organization
    const check = await pool.query(
      `SELECT am.user_name, u.organization, u.full_name, u.team 
       FROM public.accountmapping am
       LEFT JOIN public.users u ON am.user_name = u.user_name
       WHERE am.account_number = $1`,
      [cleaned_account_number]
    );

    // const alreadyRegisteredInOrg = check.rows.some(
    //   row => (row.organization || "").toLowerCase() === orgLower
    // );

    // if (alreadyRegisteredInOrg) {
    //   return res.status(409).json({
    //     message: `Account is already registered by a user from the ${organization} organization , By ${check.rows[0].full_name} from ${check.rows[0].team} Branch`,
    //   });
    // }

    if (req.body.is_mm) {
      if (check.rows.length > 0) {
        return res.status(409).json({
          message: `MM Reference is already registered by ${check.rows[0].full_name} from ${check.rows[0].team}.`,
        });
      }
    } else {
      const existingUser = check.rows.find(
        row => (row.organization || "").toLowerCase() === orgLower
      );

      if (existingUser) {
        return res.status(409).json({
          message: `Account is already registered by ${existingUser.full_name} from ${existingUser.team}, in ${existingUser.organization} Organ.`,
        });
      }
    }

    // Insert
    const result = await pool.query(
      `INSERT INTO public.accountmapping 
       (account_number, account_holder, beginning_balance, current_balance, user_name, created_at,
        process, subprocess, team, district, branch, customer_id, crm_name)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        cleaned_account_number,
        account_holder,
        0,
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
      `UPDATE public.accountmapping
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

// ✅ Delete account mapping
export const deleteAccountMapping = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public.accountmapping
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

//  Get balance difference by user role
export const getBalanceDifferenceByUser = async (req, res) => {
  const { user_id, position, team, title, subprocess, process, organization } = req.body;

  if (!user_id || !position) {
    return res.status(400).json({
      error: "User ID and position are required",
    });
  }

  try {
    let query;
    let fcyQuery;
    let values;

    if (position === "CRM" || position === "Individual" || title?.toLowerCase().includes("manager operation management")) {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmapping
        WHERE user_name = $1
      `;
      fcyQuery = `
        SELECT 
          SUM(COALESCE("LCY_CLOSING_BALANCE", 0)) - 
          SUM(COALESCE("LCY_BEGINIG_BALANCE", 0)) AS total_fcy
        FROM public.accountmappingfcy
        WHERE user_name = $1
      `;
      values = [user_id];
    }
    else if (position === "Manager") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmapping
        WHERE team = $1
      `;
      fcyQuery = `
        SELECT 
          SUM(COALESCE("LCY_CLOSING_BALANCE", 0)) - 
          SUM(COALESCE("LCY_BEGINIG_BALANCE", 0)) AS total_fcy
        FROM public.accountmappingfcy
        WHERE team = $1
      `;
      values = [team];
    } else if (position === "Director" || position === "Senior Director") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmapping
        WHERE subprocess = $1
      `;
      fcyQuery = `
        SELECT 
          SUM(COALESCE("LCY_CLOSING_BALANCE", 0)) - 
          SUM(COALESCE("LCY_BEGINIG_BALANCE", 0)) AS total_fcy
        FROM public.accountmappingfcy
        WHERE subprocess = $1
      `;
      values = [subprocess];
    }
    // else if ((position === "Director" || position === "Senior Director") && (organization === "Do")) {
    //   query = `
    //       SELECT
    //         SUM(COALESCE(bv."LOCAL_DEPOSIT", 0)) AS total_difference
    //       FROM public.branch_vital bv
    //       INNER JOIN (
    //         SELECT DISTINCT company_code
    //         FROM public.users
    //         WHERE subprocess = $1
    //           AND company_code IS NOT NULL
    //       ) u
    //         ON bv."COMPANY_CODE" = u.company_code
    //     `;

    //   fcyQuery = `
    //       SELECT
    //         SUM(COALESCE(bv."FCY", 0)) AS total_fcy
    //       FROM public.branch_vital bv
    //       INNER JOIN (
    //         SELECT DISTINCT company_code
    //         FROM public.users
    //         WHERE subprocess = $1
    //           AND company_code IS NOT NULL
    //       ) u
    //         ON bv."COMPANY_CODE" = u.company_code
    //     `;
    //   values = [subprocess];
    // }
    else if (position === "VP" || position === "CHF") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmapping
        WHERE process = $1
      `;
      fcyQuery = `
        SELECT 
          SUM(COALESCE("LCY_CLOSING_BALANCE", 0)) - 
          SUM(COALESCE("LCY_BEGINIG_BALANCE", 0)) AS total_fcy
        FROM public.accountmappingfcy
        WHERE process = $1
      `;
      values = [process];
    } else if (position === "CEO") {
      query = `
        SELECT 
          SUM(COALESCE(current_balance, 0)) - 
          SUM(COALESCE(beginning_balance, 0)) AS total_difference
        FROM public.accountmapping
      `;
      fcyQuery = `
        SELECT 
          SUM(COALESCE("LCY_CLOSING_BALANCE", 0)) - 
          SUM(COALESCE("LCY_BEGINIG_BALANCE", 0)) AS total_fcy
        FROM public.accountmappingfcy
      `;
      values = [];
    } else {
      return res.status(400).json({ error: "Invalid position" });
    }

    const result = await pool.query(query, values);
    const fcyResult = await pool.query(fcyQuery, values);

    const normalDiff = result.rows[0]?.total_difference ? Number(result.rows[0].total_difference) : 0;
    const fcyTotal = fcyResult.rows[0]?.total_fcy ? Number(fcyResult.rows[0].total_fcy) : 0;

    res.status(200).json({
      total_difference: normalDiff + fcyTotal,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getBalanceDifferenceByUserforManagers = async (req, res) => {
  const { company_code, organization, position } = req.body;

  if (!position) {
    return res.status(400).json({ error: "Position is required" });
  }
  try {
    // if (!company_code) {
    //   return res.status(400).json({ error: "Company code is required for Branch Managers" });
    // }

    const branchVitalQuery = `
        SELECT 
          "LOCAL_DEPOSIT", 
          "FCY", 
          "MERCHANT_TRANSACTION_VOLUME", 
          "AGENT_TRANSACTION_VOLUME"
        FROM public.branch_vital
        WHERE "COMPANY_CODE" = $1
      `;
    const branchVitalResult = await pool.query(branchVitalQuery, [company_code]);

    if (branchVitalResult.rows.length === 0) {
      return res.status(200).json({
        local_deposit: 0,
        fcy: 0,
        merchant_transaction_volume: 0,
        agent_transaction_volume: 0,
        total_difference: 0
      });
    }

    const row = branchVitalResult.rows[0];
    return res.status(200).json({
      local_deposit: Number(row.LOCAL_DEPOSIT) || 0,
      fcy: Number(row.FCY) || 0,
      merchant_transaction_volume: Number(row.MERCHANT_TRANSACTION_VOLUME) || 0,
      agent_transaction_volume: Number(row.AGENT_TRANSACTION_VOLUME) || 0,
      total_difference: (Number(row.LOCAL_DEPOSIT) || 0) + (Number(row.FCY) || 0)
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
export const getBalanceDifferenceByUserforDistrictDirectors = async (req, res) => {
  const { subprocess, position } = req.body;


  if (!position) {
    return res.status(400).json({ error: "Position is required" });
  }

  try {
    if (!subprocess) {
      return res.status(400).json({ error: "Subprocess is required for District Directors" });
    }

    const branchVitalQuery = `
        SELECT 
          SUM(COALESCE(bv."LOCAL_DEPOSIT", 0)) AS local_deposit,
          SUM(COALESCE(bv."FCY", 0)) AS fcy,
          SUM(COALESCE(bv."MERCHANT_TRANSACTION_VOLUME", 0)) AS merchant_transaction_volume,
          SUM(COALESCE(bv."AGENT_TRANSACTION_VOLUME", 0)) AS agent_transaction_volume
        FROM public.branch_vital bv
        INNER JOIN (
          SELECT DISTINCT company_code
          FROM public.users
          WHERE subprocess = $1
            AND company_code IS NOT NULL
        ) u
          ON bv."COMPANY_CODE" = u.company_code
      `;
    const branchVitalResult = await pool.query(branchVitalQuery, [subprocess]);
    // console.log("branchVitalResult", branchVitalResult.rows);
    if (branchVitalResult.rows.length === 0) {
      return res.status(200).json({
        local_deposit: 0,
        fcy: 0,
        merchant_transaction_volume: 0,
        agent_transaction_volume: 0,
        total_difference: 0
      });
    }

    const row = branchVitalResult.rows[0];
    const local_deposit = Number(row.local_deposit) || 0;
    const fcy = Number(row.fcy) || 0;

    return res.status(200).json({
      local_deposit: local_deposit,
      fcy: fcy,
      merchant_transaction_volume: Number(row.merchant_transaction_volume) || 0,
      agent_transaction_volume: Number(row.agent_transaction_volume) || 0,
      total_difference: local_deposit + fcy
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Import Excel for Account Mapping
export const importExcelAccountMapping = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { user_name, process, subprocess, team } = req.body;
  if (!user_name) {
    return res.status(400).json({ message: "User name is required" });
  }

  try {
    // Fetch current user details for authorization checks
    const userRes = await pool.query(
      "SELECT organization, position FROM public.users WHERE user_name = $1",
      [user_name]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        message: `User '${user_name}' not found`,
      });
    }

    const { organization, position } = userRes.rows[0];
    const orgLower = (organization || "").toLowerCase();
    const posLower = (position || "").toLowerCase();

    // Check organization eligibility
    if (orgLower !== "branch" && orgLower !== "do" && orgLower !== "ho") {
      return res.status(403).json({
        message: "Account mapping is only allowed for users from Branch, District, or Ho organizations.",
      });
    }

    // Check position eligibility
    if ((orgLower === "do" || orgLower === "ho") && posLower !== "crm") {
      return res.status(403).json({
        message: `Users from ${organization} organization must have CRM position to register accounts.`,
      });
    }
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

    // Process in batches of 5 to avoid timeouts
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
          // 1. Check duplicate account in the same organization
          const check = await pool.query(
            `SELECT am.user_name, u.organization 
             FROM public.accountmapping am
             LEFT JOIN public.users u ON am.user_name = u.user_name
             WHERE am.account_number = $1`,
            [accountNumber]
          );

          const alreadyRegisteredInOrg = check.rows.some(
            (r) => (r.organization || "").toLowerCase() === orgLower
          );

          if (alreadyRegisteredInOrg) {
            results.skipped.push({
              account: accountNumber,
              reason: `Already registered by a user from the ${organization} organization`,
            });
            return;
          }

          // 2. Fetch from Temenos
          const soapData = await fetchAccountBalanceFromSoap(accountNumber);

          // 3. Validation
          if (soapData.currency !== "ETB") {
            results.errors.push({ account: accountNumber, error: "Currency is not ETB" });
            return;
          }

          // 4. Fetch Branch Info
          let district = "";
          let branch = "";
          if (soapData.campany_code) {
            const branchRes = await pool.query(
              `SELECT b.branch_name, s.subprocess_name 
               FROM public.branches b
               JOIN public.sub_processess s ON b.subprocess_id = s.subprocess_id
               WHERE b.branch_code = $1`,
              [soapData.campany_code]
            );
            if (branchRes.rows.length > 0) {
              branch = branchRes.rows[0].branch_name;
              district = branchRes.rows[0].subprocess_name;
            }
          }

          // 5. Insert to DB
          await pool.query(
            `INSERT INTO public.accountmapping 
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

// Search account mappings by user
export const searchAccountMappingsByUser = async (req, res) => {
  const { user_id, searchTerm } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const query = `
      SELECT 
        map_id, account_number, account_holder, 
        beginning_balance, current_balance, 
        user_name, created_at,
        process, subprocess, team,
        district, branch, customer_id, crm_name
      FROM public.accountmapping
      WHERE user_name = $1
      ${searchTerm ? "AND (account_number ILIKE $2 OR account_holder ILIKE $2)" : ""}
      ORDER BY map_id
      LIMIT 50
    `;

    const values = searchTerm ? [user_id, `%${searchTerm}%`] : [user_id];

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
