import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

const getStatus = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 50) return "Good";
  return "Need Improvement";
};

export const generateEvaluationPdf = (userData, recommendation, supervisorName) => {
  const evaluated = userData.evaluated || {};
  const data = userData.data || [];
  const score = userData.total_score || 0;
  const status = evaluated.status?.toLowerCase() === 'agreed' ? 'Agreed' : 'Not Agreed Yet';
  
  const printDate = new Date().toLocaleDateString("en-GB");

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [30, 30, 30, 30],
    styles: {
      header: { fontSize: 14, bold: true, color: "#1565c0" },
      subheader: { fontSize: 9, color: "#555555" },
      sectionHeader: { fontSize: 11, bold: true, color: "#1565c0", margin: [0, 6, 0, 2], decoration: "underline" },
      label: { fontSize: 9, color: "#555555", margin: [0, 2, 0, 0] },
      value: { fontSize: 9, bold: true, margin: [0, 2, 0, 2] },
    },
    content: [
      {
        columns: [
          {
            stack: [
              { text: "PERFORMANCE REVIEW", style: "header" },
              { text: "Detailed performance metrics and strategic recommendations", style: "subheader", margin: [0, 2, 0, 0] },
            ],
          },
          {
            stack: [
              { text: `Status: ${status}`, alignment: "right", color: status === "Agreed" ? "#2e7d32" : "#ed6c02", bold: true, fontSize: 11 },
              { text: `Score: ${score.toFixed(2)}% - ${getStatus(score)}`, alignment: "right", fontSize: 10, bold: true },
            ],
          },
        ],
        margin: [0, 0, 0, 8],
      },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }], margin: [0, 4, 0, 12] },

      { text: "Employee Profile", style: "sectionHeader" },
      {
        table: {
          widths: ["auto", "*", "auto", "*"],
          body: [
            [
              { text: "Full Name:", style: "label" }, { text: evaluated.evaluated_full_name || "N/A", style: "value" },
              { text: "Position:", style: "label" }, { text: evaluated.position || "N/A", style: "value" }
            ],
            [
              { text: "Email:", style: "label" }, { text: evaluated.evaluated || "N/A", style: "value" },
              { text: "Process:", style: "label" }, { text: evaluated.process || "N/A", style: "value" }
            ],
            [
              { text: "Employee ID:", style: "label" }, { text: evaluated.employee_id || "N/A", style: "value" },
              { text: "Sub Process:", style: "label" }, { text: evaluated.subprocess || "N/A", style: "value" }
            ],
            [
              { text: "Title:", style: "label" }, { text: evaluated.title || "N/A", style: "value" },
              { text: "Branch:", style: "label" }, { text: evaluated.branch || "N/A", style: "value" }
            ]
          ]
        },
        layout: "noBorders",
        margin: [0, 0, 0, 6]
      },
      
      { text: "Strategic Recommendations", style: "sectionHeader" },
      { text: recommendation, fontSize: 9, margin: [0, 0, 0, 6], italics: true, color: "#333333" },

      { text: "Performance Breakdown by Objective", style: "sectionHeader" },
      ...data.map((obj) => {
        return [
          {
            table: {
              widths: ["*", "auto", "auto"],
              body: [
                [
                  { text: obj.objective_name, bold: true, fillColor: "#e3f2fd", color: "#1565c0", fontSize: 9 },
                  { text: "Value", bold: true, fillColor: "#e3f2fd", color: "#1565c0", fontSize: 8, alignment: "right" },
                  { text: `Score: ${Number(obj.total_score || 0).toFixed(2)} / ${obj.objective_weight}`, bold: true, fillColor: "#e3f2fd", color: "#1565c0", fontSize: 9, alignment: "right" },
                ],
                ...(obj.metrics || []).map((m) => [
                  { text: `• ${m.metric_name}`, fontSize: 8, margin: [10, 0, 0, 0] },
                  { text: m.evaluation_value || "-", fontSize: 8, alignment: "right" },
                  { text: `${Number(m.score || 0).toFixed(2)} / ${m.metric_weight || 0}`, fontSize: 8, alignment: "right", bold: true },
                ])
              ],
            },
            layout: "lightHorizontalLines",
            margin: [0, 0, 0, 6],
          }
        ];
      }).flat(),

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }], margin: [0, 10, 0, 8] },
      { text: "Agreed Document", style: "header", alignment: "center", margin: [0, 0, 0, 10] },
      
      {
        columns: [
          {
            stack: [
              { text: `SUPERVISOR: ${supervisorName.toUpperCase()}`, fontSize: 9, bold: true, color: "#555" },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: "#000" }], margin: [0, 30, 0, 2] },
              { text: "Signature", fontSize: 8, color: "#555" },
              { text: `Date: ${printDate}`, fontSize: 8, color: "#555", margin: [0, 2, 0, 0] },
            ],
          },
          {
            stack: [
              { text: `EMPLOYEE: ${(evaluated.evaluated_full_name || "____________________").toUpperCase()}`, fontSize: 9, bold: true, color: "#555", alignment: "right" },
              { canvas: [{ type: "line", x1: 15, y1: 0, x2: 215, y2: 0, lineWidth: 1, lineColor: "#000" }], margin: [0, 30, 0, 2], alignment: "right" },
              { text: "Signature", fontSize: 8, color: "#555", alignment: "right" },
              { text: `Date: ${printDate}`, fontSize: 8, color: "#555", alignment: "right", margin: [0, 2, 0, 0] },
            ],
          },
        ],
      }
    ],
  };

  const filename = `Evaluation_${(evaluated.evaluated_full_name || "Employee").replace(/\s+/g, "_")}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
};
