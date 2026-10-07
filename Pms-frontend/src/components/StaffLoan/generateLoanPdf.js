// PDF generation for approved staff loan requests using pdfmake
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";
const fmtTs = (ts) => ts ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtMoney = (v) =>
  v != null && v !== ""
    ? `ETB ${parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : "—";

// Compact label+value pair inside a cell
const cell = (lbl, val) => ({
  stack: [
    { text: lbl, fontSize: 7, color: "#777777" },
    { text: val || "—", fontSize: 8.5, bold: true, margin: [0, 1, 0, 0] },
  ],
  margin: [0, 2, 0, 2],
});

const sectionHeader = (title) => ({
  text: title,
  fontSize: 9,
  bold: true,
  color: "#1565c0",
  fillColor: "#e3f2fd",
  margin: [0, 6, 0, 3],
  padding: [2, 2, 2, 2],
});

const divider = () => ({
  canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.4, lineColor: "#dddddd" }],
  margin: [0, 3, 0, 3],
});

// Build a compact 2-column deduction mini-table
const deductionMiniTable = (rows) => ({
  table: {
    widths: ["*", "auto"],
    body: rows,
  },
  layout: {
    hLineWidth: () => 0.3,
    vLineWidth: () => 0,
    hLineColor: () => "#eeeeee",
    paddingTop: () => 2,
    paddingBottom: () => 2,
    paddingLeft: () => 3,
    paddingRight: () => 3,
  },
  margin: [0, 0, 0, 4],
  fontSize: 8,
});

// ─── main export ──────────────────────────────────────────────────────────────

export const generateLoanPdf = (request, action = "download") => {
  const isEmergency = request.loan_type === "Emergency Loan";
  const hasGuarantor = !!request.guarantor_user;

  // Parse JSON fields safely
  const otherDeductions = Array.isArray(request.deduction_other_items)
    ? request.deduction_other_items
    : (request.deduction_other_items ? JSON.parse(request.deduction_other_items) : []);

  const guarantorOtherDeductions = Array.isArray(request.guarantor_deduction_other_items)
    ? request.guarantor_deduction_other_items
    : (request.guarantor_deduction_other_items ? JSON.parse(request.guarantor_deduction_other_items) : []);

  const outstandingBalances = Array.isArray(request.outstanding_balances)
    ? request.outstanding_balances
    : (request.outstanding_balances ? JSON.parse(request.outstanding_balances) : []);

  const guarantorOutstandingBalances = Array.isArray(request.guarantor_outstanding_balances)
    ? request.guarantor_outstanding_balances
    : (request.guarantor_outstanding_balances ? JSON.parse(request.guarantor_outstanding_balances) : []);

  // ── Borrower deduction rows ──────────────────────────────────────────────────
  const borrowerRows = [
    [{ text: "Basic Salary", bold: true, fontSize: 8 }, { text: fmtMoney(request.basic_salary), bold: true, alignment: "right", fontSize: 8 }],
    [{ text: "Income Tax", fontSize: 8 }, { text: fmtMoney(request.deduction_income_tax), alignment: "right", fontSize: 8 }],
    [{ text: "7% Pension", fontSize: 8 }, { text: fmtMoney(request.deduction_pension_7), alignment: "right", fontSize: 8 }],
    ...otherDeductions.map((d) => [{ text: d.label, fontSize: 8 }, { text: fmtMoney(d.amount), alignment: "right", fontSize: 8 }]),
    ...outstandingBalances.map((b) => [{ text: b.label, fontSize: 7.5, color: "#555" }, { text: fmtMoney(b.amount), alignment: "right", fontSize: 7.5, color: "#555" }]),
    [{ text: "Total Deduction", bold: true, fillColor: "#ffebee", fontSize: 8 }, { text: fmtMoney(request.total_deduction), bold: true, fillColor: "#ffebee", alignment: "right", fontSize: 8 }],
    [{ text: "Net Salary After Deduction", bold: true, fillColor: "#e8f5e9", fontSize: 8 }, { text: fmtMoney(request.net_salary_after_deduction), bold: true, fillColor: "#e8f5e9", alignment: "right", fontSize: 8 }],
  ];

  // ── Guarantor deduction rows ─────────────────────────────────────────────────
  const guarantorRows = hasGuarantor && request.guarantor_basic_salary ? [
    [{ text: "Basic Salary", bold: true, fontSize: 8 }, { text: fmtMoney(request.guarantor_basic_salary), bold: true, alignment: "right", fontSize: 8 }],
    [{ text: "Income Tax", fontSize: 8 }, { text: fmtMoney(request.guarantor_deduction_income_tax), alignment: "right", fontSize: 8 }],
    [{ text: "7% Pension", fontSize: 8 }, { text: fmtMoney(request.guarantor_deduction_pension_7), alignment: "right", fontSize: 8 }],
    ...guarantorOtherDeductions.map((d) => [{ text: d.label, fontSize: 8 }, { text: fmtMoney(d.amount), alignment: "right", fontSize: 8 }]),
    ...guarantorOutstandingBalances.map((b) => [{ text: b.label, fontSize: 7.5, color: "#555" }, { text: fmtMoney(b.amount), alignment: "right", fontSize: 7.5, color: "#555" }]),
    [{ text: "Total Deduction", bold: true, fillColor: "#ffebee", fontSize: 8 }, { text: fmtMoney(request.guarantor_total_deduction), bold: true, fillColor: "#ffebee", alignment: "right", fontSize: 8 }],
    [{ text: "Net Salary After Deduction", bold: true, fillColor: "#e8f5e9", fontSize: 8 }, { text: fmtMoney(request.guarantor_net_salary_after_deduction), bold: true, fillColor: "#e8f5e9", alignment: "right", fontSize: 8 }],
  ] : null;

  // ── Document definition ───────────────────────────────────────────────────
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [36, 40, 36, 40],
    defaultStyle: { fontSize: 8.5 },
    styles: {
      bigHeader: { fontSize: 14, bold: true, color: "#1565c0" },
      subheader: { fontSize: 8, color: "#555555" },
    },
    content: [

      // ── Page header ──────────────────────────────────────────────────────────
      {
        columns: [
          {
            stack: [
              { text: "STAFF LOAN REQUEST", style: "bigHeader" },
              { text: "Official Approval Letter", style: "subheader", margin: [0, 1, 0, 0] },
            ],
          },
          {
            stack: [
              { text: `Request #${request.id}`, alignment: "right", bold: true, fontSize: 11 },
              { text: "APPROVED", alignment: "right", color: "#2e7d32", bold: true, fontSize: 10 },
              { text: `Approved by: ${request.approved_by || "—"}`, alignment: "right", fontSize: 7.5, color: "#555" },
              { text: `On: ${fmtTs(request.approved_at)}`, alignment: "right", fontSize: 7.5, color: "#555" },
              ...(request.approver_remarks
                ? [{ text: `Remarks: ${request.approver_remarks}`, alignment: "right", fontSize: 7, color: "#777", italics: true }]
                : []),
            ],
          },
        ],
        margin: [0, 0, 0, 4],
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 1.5, lineColor: "#1565c0" }],
        margin: [0, 2, 0, 6],
      },

      // ── Employee & Loan side-by-side ─────────────────────────────────────────
      {
        columns: [
          // Left: Employee info
          {
            width: "50%",
            stack: [
              sectionHeader("Employee Information"),
              {
                table: {
                  widths: ["*", "*"],
                  body: [
                    [cell("Full Name", request.full_name), cell("Employee ID", request.employee_id)],
                    [cell("Branch", request.branch_name), cell("Position / Title", request.position_title)],
                    [cell("Date of Hire", fmt(request.date_of_hire)), cell("Length of Service", request.length_of_service_years ? `${request.length_of_service_years} yrs` : "—")],
                    [cell("Date of Birth", fmt(request.dob)), cell("Retirement Date", fmt(request.retirement_date))],
                  ],
                },
                layout: "noBorders",
                margin: [0, 0, 6, 0],
              },
            ],
          },
          // Right: Loan details
          {
            width: "50%",
            stack: [
              sectionHeader("Loan Details"),
              {
                table: {
                  widths: ["*", "*"],
                  body: [
                    [cell("Loan Type", request.loan_type), cell("Amount Requested", fmtMoney(request.loan_amount_requested))],
                    [cell("Basic Salary", fmtMoney(request.basic_salary)), cell("Application Count", String(request.loan_application_count ?? "—"))],
                    [cell("Processing Branch", request.loan_processing_branch || "—"), cell("Assigned Processor", request.loan_processor_assigned || "—")],
                    [cell("Guarantor", request.guarantor_user || "None"), cell("Guarantor Consent", request.guarantor_user ? (request.guarantor_consent || "Pending") : "N/A")],
                  ],
                },
                layout: "noBorders",
              },
            ],
          },
        ],
      },

      divider(),

      // ── Salary & Deduction Summary ───────────────────────────────────────────
      ...(request.manager_verified ? [
        sectionHeader("Salary & Deduction Summary"),
        {
          columns: [
            // Borrower column
            {
              width: guarantorRows ? "50%" : "100%",
              stack: [
                { text: "Borrower", bold: true, fontSize: 8, color: "#1565c0", margin: [0, 0, 0, 2] },
                deductionMiniTable(borrowerRows),
                ...(request.deduction_months
                  ? [{ text: `Repayment: ${request.deduction_months} months`, fontSize: 7.5, color: "#555", margin: [0, 0, 0, 0] }]
                  : []),
              ],
              margin: [0, 0, guarantorRows ? 8 : 0, 0],
            },
            // Guarantor column (only if guarantor deduction data exists)
            ...(guarantorRows ? [{
              width: "50%",
              stack: [
                { text: `Guarantor — ${request.guarantor_user || ""}`, bold: true, fontSize: 8, color: "#6a1b9a", margin: [0, 0, 0, 2] },
                deductionMiniTable(guarantorRows),
                ...(request.guarantor_deduction_months
                  ? [{ text: `Repayment: ${request.guarantor_deduction_months} months`, fontSize: 7.5, color: "#555", margin: [0, 0, 0, 0] }]
                  : []),
              ],
            }] : []),
          ],
        },
        divider(),
      ] : []),

      // ── Declaration + Signatures side-by-side ────────────────────────────────
      {
        stack: [
          sectionHeader("Signatures"),
          {
            columns: [
              {
                stack: [
                  { text: "Employee", fontSize: 8, color: "#555", margin: [0, 0, 0, 2] },
                  { canvas: [{ type: "line", x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.8, lineColor: "#000" }], margin: [0, 22, 0, 3] },
                  { text: request.full_name || "", fontSize: 8, bold: true },
                  { text: fmt(request.date_of_request), fontSize: 7.5, color: "#777" },
                ],
              },
              {
                stack: [
                  { text: "Loan Processor", fontSize: 8, color: "#555", margin: [0, 0, 0, 2] },
                  { canvas: [{ type: "line", x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.8, lineColor: "#000" }], margin: [0, 22, 0, 3] },
                  { text: request.loan_processor_assigned || "", fontSize: 8, bold: true },
                  { text: fmtTs(request.manager_verified_at), fontSize: 7.5, color: "#777" },
                ],
              },
            ],
            columnGap: 20,
          },
        ],
        margin: [0, 12, 0, 0],
      },


      // ── Footer ──────────────────────────────────────────────────────────────
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 0.4, lineColor: "#cccccc" }],
        margin: [0, 8, 0, 3],
      },
      {
        text: "This document was system-generated by the Performance Management System. Please present it to the relevant department to proceed with the loan process.",
        fontSize: 7, color: "#999999", italics: true,
      },
    ],
  };

  const filename = `LoanRequest_${request.loan_type?.replace(/\s+/g, "_")}_${request.employee_id}_${request.id}.pdf`;

  if (action === "open") {
    pdfMake.createPdf(docDefinition).open();
  } else {
    pdfMake.createPdf(docDefinition).download(filename);
  }
};
