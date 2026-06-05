// backend/controllers/employeeController.js
import pool from "../db.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";

const toNull = (val) => (val === "" || val === undefined || val === null ? null : val);

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM public.employees
      ORDER BY employee_id
    `);
    res.json({ employees: result.rows });
  } catch (err) {
    console.error("Error fetching employees:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single employee by employee_id
export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  // Prevent bigint conversion errors for non-numeric strings
  if (id && isNaN(id)) {
    return res.status(400).json({ error: "Invalid employee ID format" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM public.employees WHERE employee_id = $1`,
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching employee:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new employee
export const createEmployee = async (req, res) => {
  const {
    display_name,
    gender,
    dob,
    supervisor,
    manager_id,
    process_name,
    sub_process_name,
    branch_name,
    title,
    job_level,
    company_entry_date,
    position_entry_date,
    base_salary,
    pay_grade,
    pay_scale_level,
    location,
    business_phone_number,
    outlook_address,
    business_email_address,
    employee_id,
    branch_grade,
    organization_unit,
  } = req.body;

  try {
    // Check if employee already exists by employee_id or outlook_address
    const existing = await pool.query(
      "SELECT * FROM public.employees WHERE employee_id = $1 OR outlook_address = $2",
      [employee_id, outlook_address],
    );

    if (existing.rows.length > 0) {
      // Use == for loose comparison as employee_id from DB might be string (bigint)
      // and from request might be string or number
      const isIdConflict = String(existing.rows[0].employee_id) === String(employee_id);
      const conflictField = isIdConflict ? "Employee ID" : "Outlook Address";

      return res.status(400).json({
        message: `Employee with this ${conflictField} already exists.`,
      });
    }

    const result = await pool.query(
      `INSERT INTO public.employees
      (display_name, gender, dob, supervisor, manager_id, process_name, sub_process_name, branch_name,
       title, job_level, company_entry_date, position_entry_date, base_salary, pay_grade,
       pay_scale_level, location, business_phone_number, outlook_address, business_email_address, employee_id, branch_grade, organization_unit)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
      [
        display_name,
        gender,
        toNull(dob),
        supervisor,
        toNull(manager_id),
        process_name,
        sub_process_name,
        branch_name,
        title,
        job_level,
        toNull(company_entry_date),
        toNull(position_entry_date),
        toNull(base_salary),
        pay_grade,
        pay_scale_level,
        location,
        business_phone_number,
        outlook_address,
        business_email_address,
        employee_id,
        branch_grade,
        organization_unit,
      ],
    );

    res.status(201).json({
      message: "Employee created successfully",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating employee:", err.message);
    res.status(500).json({
      message: "Server error occurred while creating employee",
      error: err.message
    });
  }
};



// Update an employee
export const updateEmployee = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  // List of valid fields that can be updated (matching the table structure)
  const allowedFields = [
    "display_name", "gender", "dob", "supervisor", "manager_id",
    "process_name", "sub_process_name", "branch_name", "title", "job_level",
    "company_entry_date", "position_entry_date", "base_salary", "pay_grade",
    "pay_scale_level", "location", "business_phone_number", "outlook_address",
    "business_email_address", "branch_grade", "organization_unit"
  ];

  const updatedFields = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updatedFields[key] = toNull(req.body[key]);
    }
  });

  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }

  try {
    // Build dynamic SET clause
    const setClause = Object.keys(updatedFields)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updatedFields);

    const result = await pool.query(
      `UPDATE public.employees SET ${setClause} WHERE employee_id = $${values.length + 1} RETURNING *`,
      [...values, id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    res.json({ message: "Employee updated successfully", employee: result.rows[0] });
  } catch (err) {
    console.error("Error updating employee:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Delete an employee
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  if (id && isNaN(id)) {
    return res.status(400).json({ error: "Invalid employee ID format" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM public.employees WHERE employee_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Employee not found" });

    res.json({ message: "Employee deleted", employee: result.rows[0] });
  } catch (err) {
    console.error("Error deleting employee:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// Convert Excel serial date to YYYY-MM-DD
const excelDateToJSDate = (value) => {
  if (!value) return null;

  // If it's already a valid date string, return it
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    return new Date(value).toISOString().split("T")[0];
  }

  // If it's a number (Excel serial date)
  if (typeof value === "number") {
    const utc_days = value - 25569;
    const utc_value = utc_days * 86400;
    const date = new Date(utc_value * 1000);
    return date.toISOString().split("T")[0];
  }

  return null;
};
export const uploadEmployeesFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const filePath = path.join(req.file.path);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Insert or update each row
    const insertPromises = data.map((row) =>
      pool.query(
        `INSERT INTO public.employees (
          employee_id, display_name, gender, dob, supervisor, manager_id,
          process_name, sub_process_name, branch_name, title, job_level,
          company_entry_date, position_entry_date, base_salary, pay_grade,
          pay_scale_level, location, business_phone_number, outlook_address,
          business_email_address, branch_grade, organization_unit
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        ON CONFLICT (employee_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          gender = EXCLUDED.gender,
          dob = EXCLUDED.dob,
          supervisor = EXCLUDED.supervisor,
          manager_id = EXCLUDED.manager_id,
          process_name = EXCLUDED.process_name,
          sub_process_name = EXCLUDED.sub_process_name,
          branch_name = EXCLUDED.branch_name,
          title = EXCLUDED.title,
          job_level = EXCLUDED.job_level,
          company_entry_date = EXCLUDED.company_entry_date,
          position_entry_date = EXCLUDED.position_entry_date,
          base_salary = EXCLUDED.base_salary,
          pay_grade = EXCLUDED.pay_grade,
          pay_scale_level = EXCLUDED.pay_scale_level,
          location = EXCLUDED.location,
          business_phone_number = EXCLUDED.business_phone_number,
          outlook_address = EXCLUDED.outlook_address,
          business_email_address = EXCLUDED.business_email_address,
          branch_grade = EXCLUDED.branch_grade,
          organization_unit = EXCLUDED.organization_unit`,
        [
          row["employee_id"],
          row["display_name"],
          row["gender"],
          excelDateToJSDate(row["dob"]),
          row["supervisor"],
          row["manager_id"],
          row["process_name"],
          row["sub_process_name"],
          row["branch_name"],
          row["title"],
          row["job_level"],
          excelDateToJSDate(row["company_entry_date"]),
          excelDateToJSDate(row["position_entry_date"]),
          row["base_salary"],
          row["pay_grade"],
          row["pay_scale_level"],
          row["location"],
          row["business_phone_number"],
          row["outlook_address"],
          row["business_email_address"],
          row["branch_grade"],
          row["organization_unit"],
        ],
      ),
    );

    await Promise.all(insertPromises);

    // Delete temp file
    fs.unlinkSync(filePath);

    res.json({ message: "Employees uploaded successfully!" });
  } catch (err) {
    // Log error with user info
    const user = req.user
      ? `${req.user.displayName} (${req.user.employee_id})`
      : "Unknown User";
    console.error(`Error by ${user}:`, err);

    res.status(500).json({
      error: "Failed to process Excel file",
      details: err.message,
    });
  }
};

export const downloadEmployeeTemplate = (req, res) => {
  try {
    const templateData = [
      {
        employee_id: "",
        display_name: "",
        gender: "",
        dob: "YYYY-MM-DD",
        supervisor: "",
        manager_id: "",
        process_name: "",
        sub_process_name: "",
        branch_name: "",
        title: "",
        job_level: "",
        company_entry_date: "YYYY-MM-DD",
        position_entry_date: "YYYY-MM-DD",
        base_salary: "",
        pay_grade: "",
        pay_scale_level: "",
        location: "",
        business_phone_number: "",
        outlook_address: "",
        business_email_address: "",
        branch_grade: "",
        organization_unit: "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=employee_template.xlsx",
    );
    res.send(buffer);
  } catch (err) {
    console.error("Error generating template:", err);
    res.status(500).json({ error: "Failed to generate template" });
  }
};

export const getEmployeeTitleByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      `SELECT e.employee_id,
              e.display_name,
              e.business_email_address,
              e.branch_grade,
              e.organization_unit,
              t.id as title_Id,
              t.title_name
       FROM public.employees e
       JOIN public.titles t
         ON e.title = t.title_name
       WHERE e.outlook_address = $1`,
      [email],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Employee or title not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getMyTeamBySupervisor = async (req, res) => {
  try {
    const { supervisor_email } = req.params; // email parameter

    const result = await pool.query(
      `SELECT 
          employee_id,
          display_name,
          gender,
          dob,
          supervisor,
          manager_id,
          process_name,
          sub_process_name,
          branch_name,
          title,
          job_level,
          company_entry_date,
          position_entry_date,
          base_salary,
          pay_grade,
          pay_scale_level,
          location,
          business_phone_number,
          outlook_address,
          business_email_address
       FROM public.employees
       WHERE supervisor = $1
       ORDER BY display_name ASC`,
      [supervisor_email],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const searchEmployees = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Search query is required" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM public.employees 
       WHERE employee_id::text ILIKE $1 
          OR display_name ILIKE $1 
          OR title ILIKE $1 
          OR branch_name ILIKE $1 
          OR supervisor ILIKE $1 
       LIMIT 100`,
      [`%${q}%`]
    );
    res.json({ employees: result.rows });
  } catch (err) {
    console.error("Error searching employees:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
