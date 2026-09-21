// PDF generation for approved staff loan requests using pdfmake
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const fmtTs = (ts) =>
  ts ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtMoney = (v) =>
  v != null && v !== ""
    ? `ETB ${parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : "—";

const bold = (text) => ({ text, bold: true });
const label = (text) => ({ text, color: "#555555", fontSize: 9 });

const infoRow = (lbl, val) => [
  label(lbl),
  { text: val || "—", fontSize: 10, bold: true, margin: [0, 0, 0, 4] },
];

const sectionHeader = (title) => ({
  text: title,
  fontSize: 11,
  bold: true,
  color: "#1565c0",
  margin: [0, 12, 0, 4],
  decoration: "underline",
});

const divider = () => ({
  canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }],
  margin: [0, 4, 0, 4],
});

// ─── main export ──────────────────────────────────────────────────────────────

export const generateLoanPdf = (request, action = "download") => {
  const isEmergency = request.loan_type === "Emergency Loan";

  // Parse JSON fields safely
  const otherDeductions = Array.isArray(request.deduction_other_items)
    ? request.deduction_other_items
    : (request.deduction_other_items ? JSON.parse(request.deduction_other_items) : []);

  const outstandingBalances = Array.isArray(request.outstanding_balances)
    ? request.outstanding_balances
    : (request.outstanding_balances ? JSON.parse(request.outstanding_balances) : []);

  // ── Scoring table (only for non-emergency) ────────────────────────────────
  const scoringTable = !isEmergency
    ? [
        sectionHeader("Scoring Criteria"),
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto"],
            body: [
              [
                { text: "Criterion", bold: true, fillColor: "#1565c0", color: "white", fontSize: 9 },
                { text: "Weight",    bold: true, fillColor: "#1565c0", color: "white", fontSize: 9, alignment: "center" },
                { text: "Score",     bold: true, fillColor: "#1565c0", color: "white", fontSize: 9, alignment: "center" },
              ],
              ["1. Length of Service",      "0–20", { text: String(request.service_tenure_score ?? 0),      alignment: "center" }],
              ["2. Individual Performance", "0–50", { text: String(request.individual_performance_score ?? 0), alignment: "center" }],
              ["3. Team Performance",       "0–20", { text: String(request.team_performance_score ?? 0),     alignment: "center" }],
              ["6. Disciplinary Record",    "0–10", { text: String(request.disciplinary_record_score ?? 0),  alignment: "center" }],
              [
                { text: "TOTAL SCORE", bold: true, fillColor: "#e3f2fd" },
                { text: "0–100",       bold: true, fillColor: "#e3f2fd", alignment: "center" },
                { text: String(request.total_score_claimed ?? 0), bold: true, fillColor: "#e3f2fd", alignment: "center" },
              ],
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 8],
        },
      ]
    : [
        sectionHeader("Loan Type"),
        { text: "Emergency Loan — No scoring criteria applies.", fontSize: 10, margin: [0, 0, 0, 8] },
      ];

  // ── Deduction table ───────────────────────────────────────────────────────
  const deductionRows = [
    [{ text: "Basic Salary (Monthly)", bold: true }, { text: fmtMoney(request.basic_salary), bold: true, alignment: "right" }],
    ["Income Tax",  { text: fmtMoney(request.deduction_income_tax), alignment: "right" }],
    ["7% Pension",  { text: fmtMoney(request.deduction_pension_7),  alignment: "right" }],
    ...otherDeductions.map((d) => [d.label, { text: fmtMoney(d.amount), alignment: "right" }]),
    ["Loan Repayment (this loan)", { text: fmtMoney(request.deduction_amount), alignment: "right" }],
    [
      { text: "Total Deduction",            bold: true, fillColor: "#ffebee" },
      { text: fmtMoney(request.total_deduction), bold: true, fillColor: "#ffebee", alignment: "right" },
    ],
    [
      { text: "Net Salary After Deduction", bold: true, fillColor: "#e8f5e9" },
      { text: fmtMoney(request.net_salary_after_deduction), bold: true, fillColor: "#e8f5e9", alignment: "right" },
    ],
  ];

  const deductionSection = request.manager_verified
    ? [
        sectionHeader("Salary & Deduction Summary"),
        {
          table: { widths: ["*", "auto"], body: deductionRows },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 8],
        },
        request.deduction_months
          ? { text: `Repayment Period: ${request.deduction_months} months`, fontSize: 10, margin: [0, 0, 0, 4] }
          : {},
        ...( outstandingBalances.length > 0
          ? [
              { text: "Outstanding Loan Balances", bold: true, fontSize: 10, margin: [0, 6, 0, 2] },
              {
                table: {
                  widths: ["*", "auto"],
                  body: outstandingBalances.map((b) => [b.label, { text: fmtMoney(b.amount), alignment: "right" }]),
                },
                layout: "lightHorizontalLines",
                margin: [0, 0, 0, 8],
              },
            ]
          : []
        ),
      ]
    : [];

  // ── Document definition ───────────────────────────────────────────────────
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    styles: {
      header:   { fontSize: 16, bold: true, color: "#1565c0" },
      subheader:{ fontSize: 10, color: "#555555" },
    },
    content: [
      // ── Page header ────────────────────────────────────────────────────────
      {
        columns: [
          {
            stack: [
              { text: "STAFF LOAN REQUEST", style: "header" },
              { text: "Official Approval Letter", style: "subheader", margin: [0, 2, 0, 0] },
            ],
          },
          {
            stack: [
              { text: `Request #${request.id}`, alignment: "right", bold: true, fontSize: 12 },
              { text: `Status: APPROVED`, alignment: "right", color: "#2e7d32", bold: true, fontSize: 11 },
              { text: `Date: ${fmt(request.date_of_request)}`, alignment: "right", fontSize: 9, color: "#555" },
            ],
          },
        ],
        margin: [0, 0, 0, 4],
      },
      divider(),
      { text: `Approved by: ${request.approved_by || "—"}  |  On: ${fmtTs(request.approved_at)}`, fontSize: 9, color: "#555555", margin: [0, 0, 0, 10] },

      // ── Employee Information ───────────────────────────────────────────────
      sectionHeader("Employee Information"),
      {
        columns: [
          { stack: [...infoRow("Full Name",         request.full_name), ...infoRow("Branch",   request.branch_name), ...infoRow("Date of Hire", fmt(request.date_of_hire))], width: "50%" },
          { stack: [...infoRow("Employee ID",       request.employee_id), ...infoRow("Position", request.position_title), ...infoRow("Length of Service", request.length_of_service_years ? `${request.length_of_service_years} years` : "—")], width: "50%" },
        ],
      },
      {
        columns: [
          { stack: infoRow("Date of Birth", fmt(request.dob)), width: "50%" },
          { stack: infoRow("Retirement Date", fmt(request.retirement_date)), width: "50%" },
        ],
      },
      divider(),

      // ── Loan Details ──────────────────────────────────────────────────────
      sectionHeader("Loan Details"),
      {
        columns: [
          { stack: [...infoRow("Loan Type", request.loan_type), ...infoRow("Basic Salary", fmtMoney(request.basic_salary))], width: "50%" },
          { stack: [...infoRow("Amount Requested", fmtMoney(request.loan_amount_requested)), ...infoRow("Application Count", request.loan_application_count)], width: "50%" },
        ],
      },
      request.loan_purpose
        ? { text: `Purpose: ${request.loan_purpose}`, fontSize: 10, margin: [0, 2, 0, 4] }
        : {},
      divider(),

      // ── Scoring ───────────────────────────────────────────────────────────
      ...scoringTable,
      divider(),

      // ── Deduction ─────────────────────────────────────────────────────────
      ...deductionSection,
      ...(deductionSection.length ? [divider()] : []),

      // ── Verification trail ────────────────────────────────────────────────
      sectionHeader("Verification Trail"),
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "*"],
          body: [
            [
              { text: "Stage",       bold: true, fillColor: "#1565c0", color: "white", fontSize: 9 },
              { text: "By",          bold: true, fillColor: "#1565c0", color: "white", fontSize: 9 },
              { text: "Status",      bold: true, fillColor: "#1565c0", color: "white", fontSize: 9 },
              { text: "Date",        bold: true, fillColor: "#1565c0", color: "white", fontSize: 9 },
            ],
            ["1. Submitted",      request.created_by           || "—", "✓", fmt(request.created_at)],
            ["2. Checker Review", request.checker_verified_by  || "Pending", request.checker_verified  ? "✓" : "—", fmtTs(request.checker_verified_at)],
            ["3. Manager Review", request.manager_verified_by  || "Pending", request.manager_verified  ? "✓" : "—", fmtTs(request.manager_verified_at)],
            ["4. Final Approval", request.approved_by          || "—",       "✓ APPROVED",                          fmtTs(request.approved_at)],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 8],
      },
      ...(request.approver_remarks
        ? [{ text: `Approver Remarks: ${request.approver_remarks}`, fontSize: 9, color: "#555", margin: [0, 0, 0, 8] }]
        : []),
      divider(),

      // ── Declaration ───────────────────────────────────────────────────────
      sectionHeader("Staff Declaration"),
      {
        text: "The employee has confirmed that all information and self-assessment scores provided are true and accurate.",
        fontSize: 9, color: "#555555", margin: [0, 0, 0, 12],
      },

      // ── Signature area ────────────────────────────────────────────────────
      {
        columns: [
          {
            stack: [
              { text: "Employee Signature", fontSize: 9, color: "#555" },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.8, lineColor: "#000" }], margin: [0, 20, 0, 2] },
              { text: request.full_name, fontSize: 9 },
              { text: `Date: ${fmt(request.date_of_request)}`, fontSize: 9, color: "#555" },
            ],
          },
          {
            stack: [
              { text: "Approver Signature", fontSize: 9, color: "#555" },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.8, lineColor: "#000" }], margin: [0, 20, 0, 2] },
              { text: request.approved_by || "", fontSize: 9 },
              { text: `Date: ${fmtTs(request.approved_at)}`, fontSize: 9, color: "#555" },
            ],
          },
        ],
        margin: [0, 8, 0, 0],
      },

      // ── Footer note ───────────────────────────────────────────────────────
      {
        text: "This document was system-generated by the Performance Management System. Please present it to the relevant department to proceed with the loan process.",
        fontSize: 8, color: "#888888", margin: [0, 20, 0, 0], italics: true,
      },
    ],
  };

  const filename = `LoanRequest_${request.loan_type?.replace(/\s+/g,"_")}_${request.employee_id}_${request.id}.pdf`;

  if (action === "open") {
    pdfMake.createPdf(docDefinition).open();
  } else {
    pdfMake.createPdf(docDefinition).download(filename);
  }
};
