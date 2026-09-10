// PMS Quarterly Briefing deck — Cooperative Bank of Oromia
// Build: node build_deck.js
const pptxgen = require("pptxgenjs");

const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
p.author = "Cooperative Bank of Oromia";
p.title = "PMS — Status & Challenges Briefing (Q1 FY 2026/27)";

// ── Palette (CoopBank brand: deep navy + cyan; orange reserved for challenges)
const NAVY = "0A2463";
const NAVY2 = "123A7A"; // lighter navy for panels on dark
const CYAN = "00AEEF";
const CYAN_D = "0089BC";
const ORANGE = "F58220";
const BG = "FFFFFF";
const PANEL = "F1F7FB";
const TEXT = "1E293B";
const MUTED = "64748B";
const ONDARK = "FFFFFF";
const ONDARK_MUTED = "8FC4E4";
const W = 13.33, H = 7.5, M = 0.6;
const F = "Arial";

// ── Helpers (fresh objects every call — pptxgenjs mutates in place)
const shadow = () => ({ type: "outer", color: "0A2463", blur: 7, offset: 2, angle: 90, opacity: 0.14 });
const bu = () => ({ code: "25B8", indent: 12 });

function pageFooter(s, n, dark = false) {
  s.addText("Cooperative Bank of Oromia · Performance Management System", {
    x: M, y: H - 0.42, w: 7, h: 0.3, fontSize: 10, fontFace: F,
    color: dark ? ONDARK_MUTED : "9AA9BC", align: "left", margin: 0,
  });
  s.addText(String(n), {
    x: W - M - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontSize: 10, fontFace: F,
    color: dark ? ONDARK_MUTED : "9AA9BC", align: "right", margin: 0,
  });
}

function contentTitle(s, kicker, title) {
  s.addText(kicker.toUpperCase(), {
    x: M, y: 0.42, w: W - 2 * M, h: 0.3, fontSize: 12, fontFace: F,
    color: CYAN_D, bold: true, charSpacing: 3, margin: 0,
  });
  s.addText(title, {
    x: M, y: 0.72, w: W - 2 * M, h: 0.75, fontSize: 30, fontFace: F,
    color: TEXT, bold: true, margin: 0,
  });
}

// ════════════════════════════ S1 · TITLE (dark) ════════════════════════════
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  // soft brand glows (echoes the app hero)
  s.addShape(p.shapes.OVAL, { x: 9.4, y: -1.6, w: 5.4, h: 5.4, fill: { color: CYAN, transparency: 88 }, line: { type: "none" } });
  s.addShape(p.shapes.OVAL, { x: -1.8, y: 4.6, w: 4.6, h: 4.6, fill: { color: CYAN, transparency: 90 }, line: { type: "none" } });
  s.addShape(p.shapes.OVAL, { x: 10.6, y: 5.4, w: 2.6, h: 2.6, fill: { color: "0D9488", transparency: 86 }, line: { type: "none" } });

  s.addText("COOPERATIVE BANK OF OROMIA", {
    x: M, y: 1.15, w: 10, h: 0.35, fontSize: 13, fontFace: F, color: CYAN, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText("Performance Management System", {
    x: M, y: 1.62, w: 11.6, h: 1.6, fontSize: 48, fontFace: F, color: ONDARK, bold: true, margin: 0,
  });
  s.addText("How the system works · Where we stand · Key challenges", {
    x: M, y: 3.3, w: 11.5, h: 0.5, fontSize: 20, fontFace: F, color: ONDARK_MUTED, margin: 0,
  });

  // quarter chip
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.35, w: 3.55, h: 0.62, rectRadius: 0.09, fill: { color: NAVY2 }, line: { color: CYAN, width: 1 } });
  s.addText("Q1 FY 2026/27  ·  Jul 1 – Sep 30, 2026", {
    x: M + 0.15, y: 4.35, w: 3.35, h: 0.62, fontSize: 13, fontFace: F, color: ONDARK, bold: true, valign: "middle", margin: 0,
  });

  s.addText("Quarterly review briefing — prepared by the Employee Performance Management team", {
    x: M, y: 6.35, w: 11, h: 0.35, fontSize: 12.5, fontFace: F, color: ONDARK_MUTED, margin: 0,
  });
  s.addNotes("Welcome. Purpose today: walk through how the PMS works end to end, where the rollout stands now that we are in Q1 of FY 2026/27, and the three challenges we need management support on.");
}

// ════════════════════════════ S2 · AGENDA ════════════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  s.addText("AGENDA", {
    x: M, y: 0.5, w: 4.4, h: 0.4, fontSize: 13, fontFace: F, color: CYAN_D, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText("Three things to cover", {
    x: M, y: 0.95, w: 4.6, h: 1.5, fontSize: 34, fontFace: F, color: TEXT, bold: true, margin: 0,
  });
  s.addText("A short walk-through of the system itself, an honest status update on the first full quarter, and the challenges we are carrying into Q1.", {
    x: M, y: 2.6, w: 4.1, h: 2.6, fontSize: 15, fontFace: F, color: MUTED, margin: 0,
  });

  const items = [
    ["How the system works", "Targets, actual data capture, dashboards and evaluation — one connected cycle."],
    ["Where we stand", "Q4 FY 2025/26 was our first bank-wide quarter — what was delivered and how it went."],
    ["Challenges & way forward", "Result-acceptance delays, missing data feeds, adoption — and what we are doing about each."],
  ];
  items.forEach((it, i) => {
    const y = 1.05 + i * 1.85;
    s.addText("0" + (i + 1), {
      x: 5.6, y, w: 1.3, h: 1.2, fontSize: 54, fontFace: F, color: CYAN, bold: true, margin: 0,
    });
    s.addText(it[0], {
      x: 7.0, y: y + 0.05, w: 5.7, h: 0.5, fontSize: 20, fontFace: F, color: TEXT, bold: true, margin: 0,
    });
    s.addText(it[1], {
      x: 7.0, y: y + 0.6, w: 5.7, h: 0.85, fontSize: 13.5, fontFace: F, color: MUTED, margin: 0,
    });
    if (i < 2) s.addShape(p.shapes.LINE, { x: 5.6, y: y + 1.62, w: 7.1, h: 0, line: { color: "D8E4EE", width: 1 } });
  });
  pageFooter(s, 2);
}

// ════════════════════ S3 · QUARTERLY PERFORMANCE CYCLE ════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  contentTitle(s, "How the system works", "One connected quarterly cycle");
  s.addText("Every quarter runs the same five steps — targets in, results out, employees signed on.", {
    x: M, y: 1.5, w: 11.5, h: 0.4, fontSize: 14, fontFace: F, color: MUTED, margin: 0,
  });

  const steps = [
    ["Target setting", "Branch, district and bank targets set in the system and approved."],
    ["Actual capture", "Deposit, FCY, loan and KPI actuals flow in from bank systems."],
    ["Monitoring", "Role-based dashboards track achievement vs. expected pace, live."],
    ["Evaluation & scoring", "Weighted metrics scored out of 100 per employee."],
    ["Acceptance", "Employees review their result and click Agree; feedback recorded."],
  ];
  const cw = 2.25, gap = 0.22, y = 2.25, ch = 3.3;
  steps.forEach((st, i) => {
    const x = M + i * (cw + gap);
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: PANEL }, line: { color: "DCE9F2", width: 1 }, shadow: shadow(),
    });
    s.addShape(p.shapes.OVAL, { x: x + 0.22, y: y + 0.25, w: 0.55, h: 0.55, fill: { color: CYAN }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.22, y: y + 0.25, w: 0.55, h: 0.55, fontSize: 20, fontFace: F, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(st[0], { x: x + 0.2, y: y + 1.0, w: cw - 0.4, h: 0.75, fontSize: 15.5, fontFace: F, color: TEXT, bold: true, margin: 0 });
    s.addText(st[1], { x: x + 0.2, y: y + 1.8, w: cw - 0.4, h: 1.35, fontSize: 11.5, fontFace: F, color: MUTED, margin: 0 });
    if (i < 4) s.addText("›", { x: x + cw - 0.06, y: y + 1.25, w: 0.36, h: 0.6, fontSize: 30, fontFace: F, color: CYAN, bold: true, align: "center", margin: 0 });
  });

  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.05, w: W - 2 * M, h: 0.62, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("Cycle in progress now:  Q1 FY 2026/27 — July 1 to September 30, 2026  ·  roughly three-quarters of the quarter elapsed", {
    x: M + 0.25, y: 6.05, w: W - 2 * M - 0.5, h: 0.62, fontSize: 13, fontFace: F, color: ONDARK, valign: "middle", margin: 0,
  });
  pageFooter(s, 3);
}

// ════════════════════ S4 · WHO SETS WHICH TARGET ════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  contentTitle(s, "How the system works", "Targets are set by the line, approved in the system");

  const rows = [
    ["Branch Manager / Eco & Micro MOM", "Branch targets — deposit, FCY, loan collection"],
    ["Area Manager", "Own consolidated target for assigned branches"],
    ["District Director", "District deposit & FCY targets (loan flows from branches)"],
    ["C-Suite & enterprise roles", "Bank-wide view built up from district targets"],
  ];
  rows.forEach((r, i) => {
    const y = 1.75 + i * 0.92;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y, w: 7.6, h: 0.76, rectRadius: 0.08, fill: { color: i === 0 ? PANEL : "FFFFFF" }, line: { color: "DCE9F2", width: 1 } });
    s.addText(r[0], { x: M + 0.25, y: y + 0.08, w: 3.6, h: 0.6, fontSize: 13.5, fontFace: F, color: TEXT, bold: true, valign: "middle", margin: 0 });
    s.addText(r[1], { x: M + 3.95, y: y + 0.08, w: 3.5, h: 0.6, fontSize: 11.5, fontFace: F, color: MUTED, valign: "middle", margin: 0 });
  });
  s.addText("Special cases handled in the system: Eco and Micro branches are represented by their Operation Manager (greatest target wins when two set one), and relationship-office districts roll branch targets up when no district target exists.", {
    x: M, y: 5.6, w: 7.6, h: 1.1, fontSize: 11.5, fontFace: F, color: MUTED, margin: 0,
  });

  // right: approval flow + coverage
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 8.6, y: 1.75, w: 4.15, h: 3.35, rectRadius: 0.09, fill: { color: NAVY }, line: { type: "none" }, shadow: shadow() });
  s.addText("APPROVAL WORKFLOW", { x: 8.85, y: 1.98, w: 3.7, h: 0.3, fontSize: 11, fontFace: F, color: CYAN, bold: true, charSpacing: 2, margin: 0 });
  const flow = ["Draft — manager enters targets", "Pending — submitted for approval", "Approved — locked for the quarter"];
  flow.forEach((f, i) => {
    const y = 2.42 + i * 0.62;
    s.addShape(p.shapes.OVAL, { x: 8.9, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: CYAN }, line: { type: "none" } });
    s.addText(String(i + 1), { x: 8.9, y: y + 0.05, w: 0.3, h: 0.3, fontSize: 11, fontFace: F, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(f, { x: 9.32, y, w: 3.25, h: 0.42, fontSize: 12, fontFace: F, color: ONDARK, valign: "middle", margin: 0 });
  });
  s.addText("5,169 approved target records", { x: 8.85, y: 4.42, w: 3.7, h: 0.4, fontSize: 15, fontFace: F, color: ONDARK, bold: true, margin: 0 });
  s.addText("covering every branch, district and enterprise role", { x: 8.85, y: 4.78, w: 3.7, h: 0.3, fontSize: 10.5, fontFace: F, color: ONDARK_MUTED, margin: 0 });

  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 8.6, y: 5.35, w: 4.15, h: 1.35, rectRadius: 0.09, fill: { color: PANEL }, line: { color: "DCE9F2", width: 1 } });
  s.addText([
    { text: "670 branch target holders", options: { bold: true, color: TEXT, breakLine: true } },
    { text: "617 branch managers + 48 Eco + 5 Micro operation managers — every branch in the bank has an accountable target.", options: { color: MUTED } },
  ], { x: 8.85, y: 5.5, w: 3.7, h: 1.05, fontSize: 11, fontFace: F, margin: 0 });
  pageFooter(s, 4);
}

// ════════════════════ S5 · ACTUAL DATA CAPTURE ════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  contentTitle(s, "How the system works", "Two kinds of actuals — one scorecard");

  const colY = 1.8, colH = 4.15, colW = 6.05;
  // Automated column
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: colY, w: colW, h: colH, rectRadius: 0.09, fill: { color: PANEL }, line: { color: "BFE3F5", width: 1.25 } });
  s.addText("AUTOMATED FROM BANK SYSTEMS", { x: M + 0.3, y: colY + 0.22, w: colW - 0.6, h: 0.32, fontSize: 12.5, fontFace: F, color: CYAN_D, bold: true, charSpacing: 1.5, margin: 0 });
  s.addText([
    { text: "Deposit & FCY position — per branch, from the data warehouse", options: { bullet: bu(), breakLine: true } },
    { text: "Loan due collection — direct DW feed per branch", options: { bullet: bu(), breakLine: true } },
    { text: "Mapped deposit, FCY & loan account balances per employee", options: { bullet: bu(), breakLine: true } },
    { text: "Non-deposit KPIs — cash, cards, agents, digital, audits and more", options: { bullet: bu() } },
  ], { x: M + 0.3, y: colY + 0.7, w: colW - 0.6, h: 2.6, fontSize: 12.5, fontFace: F, color: TEXT, paraSpaceAfter: 10, margin: 0 });
  s.addText("Measured live — dashboards read these feeds directly.", {
    x: M + 0.3, y: colY + 3.55, w: colW - 0.6, h: 0.5, fontSize: 11, fontFace: F, color: CYAN_D, bold: true, margin: 0,
  });

  // Manual column
  const x2 = M + colW + 0.43;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: x2, y: colY, w: colW, h: colH, rectRadius: 0.09, fill: { color: "FFF7EF" }, line: { color: "F5C99B", width: 1.25 } });
  s.addText("MANUAL — SUPERVISOR INPUT", { x: x2 + 0.3, y: colY + 0.22, w: colW - 0.6, h: 0.32, fontSize: 12.5, fontFace: F, color: "C05621", bold: true, charSpacing: 1.5, margin: 0 });
  s.addText([
    { text: "KPIs the system cannot measure yet — entered by the supervisor", options: { bullet: bu(), breakLine: true } },
    { text: "Quality, compliance, uptime, recruitment-type metrics", options: { bullet: bu(), breakLine: true } },
    { text: "Depends on people, not pipelines — slower and error-prone", options: { bullet: bu() } },
  ], { x: x2 + 0.3, y: colY + 0.7, w: colW - 0.6, h: 2.2, fontSize: 12.5, fontFace: F, color: TEXT, paraSpaceAfter: 10, margin: 0 });
  s.addText("Many KPIs are still in this column — our biggest structural gap.", {
    x: x2 + 0.3, y: colY + 3.55, w: colW - 0.6, h: 0.5, fontSize: 11, fontFace: F, color: "C05621", bold: true, margin: 0,
  });

  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.25, w: W - 2 * M, h: 0.6, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("Standing goal: shrink the manual share every quarter, so evaluations run on system data with minimal supervisor interruption.", {
    x: M + 0.25, y: 6.25, w: W - 2 * M - 0.5, h: 0.6, fontSize: 12.5, fontFace: F, color: ONDARK, valign: "middle", margin: 0,
  });
  pageFooter(s, 5);
}

// ════════════════════ S6 · ROLE-BASED DASHBOARDS ════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  contentTitle(s, "How the system works", "Every role sees exactly its own scope");

  const rows = [
    ["Enterprise — CEO, CCO & chiefs", "Bank-wide: district, area-manager and branch breakdowns with live targets vs. actuals"],
    ["C-Suite executives", "Bank-wide aggregates only — no drill-down detail"],
    ["District Director", "Own district: branches, area managers and district targets"],
    ["Area Manager", "Assigned branches plus own consolidated performance"],
    ["Branch Manager / Eco & Micro MOM", "Own branch scorecard"],
    ["Every employee", "My Dashboard — personal metrics, score out of 100, self-report inputs"],
  ];
  rows.forEach((r, i) => {
    const y = 1.78 + i * 0.82;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y, w: W - 2 * M, h: 0.68, rectRadius: 0.08, fill: { color: i % 2 === 0 ? PANEL : "FFFFFF" }, line: { color: "DCE9F2", width: 1 } });
    s.addText(r[0], { x: M + 0.28, y: y + 0.05, w: 4.3, h: 0.58, fontSize: 13, fontFace: F, color: TEXT, bold: true, valign: "middle", margin: 0 });
    s.addText(r[1], { x: M + 4.75, y: y + 0.05, w: 7.2, h: 0.58, fontSize: 12, fontFace: F, color: MUTED, valign: "middle", margin: 0 });
  });

  s.addText("Achievement is always shown against the expected pace — target as of today, not the full quarter — so every role reads the same signal the same way.", {
    x: M, y: 6.85, w: W - 2 * M, h: 0.35, fontSize: 11.5, fontFace: F, color: MUTED, italic: true, margin: 0,
  });
  pageFooter(s, 6);
}

// ════════════════════ S7 · SCALE (dark stats) ════════════════════
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addShape(p.shapes.OVAL, { x: 10.2, y: -1.9, w: 5, h: 5, fill: { color: CYAN, transparency: 90 }, line: { type: "none" } });
  s.addText("THE SYSTEM TODAY, IN NUMBERS", {
    x: M, y: 0.55, w: 10, h: 0.35, fontSize: 12.5, fontFace: F, color: CYAN, bold: true, charSpacing: 3, margin: 0,
  });
  s.addText("Live on the bank's own data", {
    x: M, y: 0.95, w: 11, h: 0.7, fontSize: 30, fontFace: F, color: ONDARK, bold: true, margin: 0,
  });

  const stats = [
    ["767", "branches onboarded"],
    ["23", "districts & business units"],
    ["31", "area managers in scope"],
    ["5,169", "approved target records"],
    ["5.2B ETB", "deposit position tracked"],
    ["11.1B ETB", "loan collection tracked"],
  ];
  const cw = 3.85, ch = 1.95, gx = 0.3, gy = 0.35;
  stats.forEach((st, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * (cw + gx), y = 2.0 + row * (ch + gy);
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: NAVY2 }, line: { color: "1E5A9C", width: 1 } });
    s.addText(st[0], { x: x + 0.25, y: y + 0.22, w: cw - 0.5, h: 0.85, fontSize: 40, fontFace: F, color: CYAN, bold: true, margin: 0 });
    s.addText(st[1], { x: x + 0.25, y: y + 1.18, w: cw - 0.5, h: 0.55, fontSize: 13, fontFace: F, color: ONDARK_MUTED, margin: 0 });
  });

  s.addText("Figures from the live PMS database, Q1 FY 2026/27. Deposit and loan figures are actuals captured from the data warehouse this quarter.", {
    x: M, y: 6.55, w: W - 2 * M, h: 0.35, fontSize: 10.5, fontFace: F, color: ONDARK_MUTED, margin: 0,
  });
  pageFooter(s, 7, true);
}

// ════════════════════ S8 · WHERE WE STAND (timeline) ════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  contentTitle(s, "Where we stand", "First bank-wide quarter done — second one running");

  // timeline spine
  s.addShape(p.shapes.LINE, { x: M + 0.4, y: 2.42, w: W - 2 * M - 0.8, h: 0, line: { color: "C9DEEC", width: 2.5 } });
  s.addShape(p.shapes.OVAL, { x: M + 0.28, y: 2.3, w: 0.26, h: 0.26, fill: { color: CYAN }, line: { type: "none" } });
  s.addShape(p.shapes.OVAL, { x: W - M - 0.54, y: 2.3, w: 0.26, h: 0.26, fill: { color: NAVY }, line: { type: "none" } });

  const cardY = 2.85, cardH = 3.35, cardW = 5.85;
  // Q4 card
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: cardY, w: cardW, h: cardH, rectRadius: 0.09, fill: { color: PANEL }, line: { color: "DCE9F2", width: 1 }, shadow: shadow() });
  s.addText("Q4 FY 2025/26 — DONE", { x: M + 0.3, y: cardY + 0.22, w: cardW - 0.6, h: 0.3, fontSize: 12, fontFace: F, color: CYAN_D, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Bank-wide go-live & first full evaluation", { x: M + 0.3, y: cardY + 0.55, w: cardW - 0.6, h: 0.75, fontSize: 17, fontFace: F, color: TEXT, bold: true, margin: 0 });
  s.addText([
    { text: "All branch employees and CRM staff at head office evaluated", options: { bullet: bu(), breakLine: true } },
    { text: "Scored on system actuals plus supervisor manual input", options: { bullet: bu(), breakLine: true } },
    { text: "Outcome: completed — mostly successful", options: { bullet: bu() } },
  ], { x: M + 0.3, y: cardY + 1.4, w: cardW - 0.6, h: 1.75, fontSize: 12.5, fontFace: F, color: TEXT, paraSpaceAfter: 9, margin: 0 });

  // Q1 card
  const x2 = M + cardW + 0.43;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: x2, y: cardY, w: cardW, h: cardH, rectRadius: 0.09, fill: { color: NAVY }, line: { type: "none" }, shadow: shadow() });
  s.addText("Q1 FY 2026/27 — IN PROGRESS", { x: x2 + 0.3, y: cardY + 0.22, w: cardW - 0.6, h: 0.3, fontSize: 12, fontFace: F, color: CYAN, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Second quarterly cycle underway", { x: x2 + 0.3, y: cardY + 0.55, w: cardW - 0.6, h: 0.75, fontSize: 17, fontFace: F, color: ONDARK, bold: true, margin: 0 });
  s.addText([
    { text: "Targets approved and actuals flowing for Jul–Sep", options: { bullet: bu(), breakLine: true } },
    { text: "Major dashboard upgrades shipped — role-based views, achievement vs. expected pace", options: { bullet: bu(), breakLine: true } },
    { text: "Focus: a faster, cleaner cycle than Q4", options: { bullet: bu() } },
  ], { x: x2 + 0.3, y: cardY + 1.4, w: cardW - 0.6, h: 1.75, fontSize: 12.5, fontFace: F, color: ONDARK, paraSpaceAfter: 9, margin: 0 });

  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.45, w: W - 2 * M, h: 0.55, rectRadius: 0.08, fill: { color: "FFF7EF" }, line: { color: "F5C99B", width: 1 } });
  s.addText("Three challenges carried out of Q4 are shaping this quarter — next three slides.", {
    x: M + 0.25, y: 6.45, w: W - 2 * M - 0.5, h: 0.55, fontSize: 12.5, fontFace: F, color: "9A5B1F", bold: true, valign: "middle", margin: 0,
  });
  pageFooter(s, 8);
}

// ════════════ S9–S11 · CHALLENGES (shared layout) ════════════
function challengeSlide(num, n, title, tag, facts, impact) {
  const s = p.addSlide();
  s.background = { color: BG };
  s.addText("CHALLENGE " + num + (tag ? "  ·  " + tag : ""), {
    x: M, y: 0.5, w: 9, h: 0.35, fontSize: 12.5, fontFace: F, color: ORANGE, bold: true, charSpacing: 3, margin: 0,
  });
  s.addText(num, {
    x: W - M - 3.4, y: 0.28, w: 3.4, h: 1.9, fontSize: 110, fontFace: F, color: "FBE3CC", bold: true, align: "right", margin: 0,
  });
  s.addText(title, {
    x: M, y: 0.9, w: 9.6, h: 1.35, fontSize: 28, fontFace: F, color: TEXT, bold: true, margin: 0,
  });

  s.addText("WHAT HAPPENED", { x: M, y: 2.65, w: 5, h: 0.3, fontSize: 11.5, fontFace: F, color: MUTED, bold: true, charSpacing: 2, margin: 0 });
  s.addText(facts.map((f, i) => ({ text: f, options: { bullet: bu(), breakLine: i < facts.length - 1 } })), {
    x: M, y: 3.0, w: 7.5, h: 2.6, fontSize: 14, fontFace: F, color: TEXT, paraSpaceAfter: 12, margin: 0,
  });

  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.9, w: W - 2 * M, h: 0.95, rectRadius: 0.09, fill: { color: "FFF1E2" }, line: { color: "F5C99B", width: 1 } });
  s.addText([
    { text: "IMPACT   ", options: { bold: true, color: "C05621", fontSize: 11.5 } },
    { text: impact, options: { color: TEXT, fontSize: 12.5 } },
  ], { x: M + 0.3, y: 5.9, w: W - 2 * M - 0.6, h: 0.95, valign: "middle", fontFace: F, margin: 0 });
  pageFooter(s, n);
  return s;
}

challengeSlide("01", 9, "Employees were slow to accept their results",
  "RESULT ACCEPTANCE",
  [
    "After evaluation, each employee must review their score out of 100 and click Agree",
    "Employees were reluctant to accept — the Agree button sat unclicked for long periods",
    "Acceptance alone took almost two weeks of the cycle",
  ],
  "The new quarter could not start on time — target setting waited on the previous quarter's sign-off."
);

challengeSlide("02", 10, "Missing actual data keeps evaluations manual",
  "TOP CHALLENGE",
  [
    "Some actual data simply never reached us — the assigned business teams did not respond as needed",
    "KPIs without a system feed still rely on manual supervisor input today",
    "Our intention is to minimise manual intervention in scoring — this gap blocks it",
    "The issue is still open going into Q1 FY 2026/27",
  ],
  "The largest share of KPIs remains manually entered — the single biggest drag on accuracy, speed and trust in the results."
);

challengeSlide("03", 11, "Employee–system interaction across branches",
  "ADOPTION",
  [
    "Interacting with the system proved difficult for many branch users",
    "Every step — targets, inputs, reviews — took longer than it should",
    "This stretched the whole Q4 evaluation across the bank",
  ],
  "A usability and adoption gap, not a technology gap — it multiplies the cost of everything else."
);

// ════════════════════ S12 · WAY FORWARD ════════════════════
{
  const s = p.addSlide();
  s.background = { color: BG };
  contentTitle(s, "Way forward", "Four moves for Q1 and beyond");

  const rows = [
    ["Bring the missing data feeds in", "Work jointly with the assigned business teams to connect the outstanding actual data — the top priority, and the fix with the biggest payoff."],
    ["Shrink the manual share, KPI by KPI", "Convert manually entered KPIs to system-captured ones every quarter until supervisor input is the exception."],
    ["Make acceptance fast and unavoidable", "Simplify the agreement flow, add reminders and escalation so sign-off stops consuming weeks."],
    ["Invest in branch adoption", "Hands-on training and continued simplification of screens, guided by the business team's ongoing requirement updates."],
  ];
  rows.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * 6.28, y = 1.85 + row * 2.35;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.9, h: 2.1, rectRadius: 0.09, fill: { color: PANEL }, line: { color: "DCE9F2", width: 1 }, shadow: shadow() });
    s.addShape(p.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fontSize: 17, fontFace: F, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(r[0], { x: x + 0.95, y: y + 0.22, w: 4.75, h: 0.6, fontSize: 15.5, fontFace: F, color: TEXT, bold: true, margin: 0 });
    s.addText(r[1], { x: x + 0.95, y: y + 0.9, w: 4.75, h: 1.05, fontSize: 11.5, fontFace: F, color: MUTED, margin: 0 });
  });

  s.addText("Development continues in step with the business team — requirements are updated and shipped continuously.", {
    x: M, y: 6.7, w: W - 2 * M, h: 0.35, fontSize: 11.5, fontFace: F, color: MUTED, italic: true, margin: 0,
  });
  pageFooter(s, 12);
}

// ════════════════════ S13 · CLOSING (dark) ════════════════════
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addShape(p.shapes.OVAL, { x: -1.5, y: -1.8, w: 5, h: 5, fill: { color: CYAN, transparency: 90 }, line: { type: "none" } });
  s.addShape(p.shapes.OVAL, { x: 10.4, y: 4.8, w: 4.4, h: 4.4, fill: { color: CYAN, transparency: 88 }, line: { type: "none" } });

  s.addText("Q1 FY 2026/27 IS UNDERWAY", {
    x: M, y: 2.15, w: 11, h: 0.4, fontSize: 13, fontFace: F, color: CYAN, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText("Thank you.", {
    x: M, y: 2.6, w: 11.5, h: 1.1, fontSize: 52, fontFace: F, color: ONDARK, bold: true, margin: 0,
  });
  s.addText("The first bank-wide quarter proved the system works. Our job now is to make it faster,\nmore automated and easier to use — with your support on the data feeds.", {
    x: M, y: 3.85, w: 11.3, h: 1.0, fontSize: 16, fontFace: F, color: ONDARK_MUTED, margin: 0,
  });
  s.addText("Questions & discussion", {
    x: M, y: 5.6, w: 10, h: 0.45, fontSize: 15, fontFace: F, color: ONDARK, bold: true, margin: 0,
  });
  pageFooter(s, 13, true);
}

p.writeFile({ fileName: "../PMS_Status_Briefing_Q1_FY2026-27.pptx" }).then(() => console.log("deck written"));
