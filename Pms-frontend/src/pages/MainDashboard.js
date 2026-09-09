import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Paper,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  TextField,
  InputAdornment,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import GroupsIcon from "@mui/icons-material/Groups";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import axiosOriginal from "axios";
import { AuthContext } from "../AuthContext";
import { toast } from "react-toastify";

// ─── Axios wrapper (silent error recovery) ────────────────────────────────────
const axios = {
  ...axiosOriginal,
  get: (...args) =>
    axiosOriginal.get(...args).catch((err) => {
      console.error("GET error:", err);
      return { data: {} };
    }),
  post: (...args) =>
    axiosOriginal.post(...args).catch((err) => {
      console.error("POST error:", err);
      return { data: {} };
    }),
};

// ─── 6-Band Performance Colour System ────────────────────────────────────────
// Per business requirement:
// #1  < 0%        Dark Red   #C00000  — Negative / Below Baseline
// #2  0–50%       Red        #FF0000  — Severe Underperformance
// #3  50–75%      Orange     #F58220  — Underperformance
// #4  75–100%     Yellow     #FFC000  — Approaching Target
// #5  100–120%    Green      #00B050  — Target Met
// #6  ≥ 120%      Cyan Blue  #00AEEF  — Exceptional Performance

const getBandColor = (rate) => {
  if (rate < 0) return "#C00000";
  if (rate < 50) return "#FF0000";
  if (rate < 75) return "#F58220";
  if (rate < 100) return "#FFC000";
  if (rate < 120) return "#00B050";
  return "#00AEEF";
};

const getBandLabel = (rate) => {
  if (rate < 0) return "Below Baseline";
  if (rate < 50) return "Severe Underperformance";
  if (rate < 75) return "Underperformance";
  if (rate < 100) return "Approaching Target";
  if (rate < 120) return "Target Met ✓";
  return "Exceptional ★";
};

// Yellow band (#FFC000) needs dark text for legibility
const needsDarkText = (rate) => rate >= 75 && rate < 100;

// ─── Role Scope Resolution (title-based per visibility matrix) ────────────────
const resolveScope = (title = "", position = "", organization = "", team = "") => {
  if (["Chief Executive Officer", "Chief, Commercial Officer"].includes(title))
    return "enterprise";
  // C-Suite Executive Management: other Chiefs (position CEO/CHF at Head Office)
  if ((position === "CEO" || position === "CHF") && organization === "Ho")
    return "csuite";
  if (
    [
      "Director, District Coordination and Support",
      "Manager, District Coordination",
      "Manager, District Execution Monitoring",
    ].includes(title)
  )
    return "all_districts";
  if (
    [
      "Senior Director, Talent Acquisition and Career Pathways",
      "Director, Talent and Performance Management",
      "Manager, Employee Performance Management",
    ].includes(title)
  )
    return "enterprise_all";
  if (
    (title && /^Director.*District$/i.test(title)) ||
    ((position === "Director" || position === "Senior Director") &&
      organization === "Do")
  )
    return "own_district";
  if (title === "Area Manager") return "assigned_branches";
  if (title.includes("Branch Manager")) return "own_branch";
  // On "Eco" branches the Manager Operation Management acts as the branch
  // manager, so they get the branch-level view
  if (title.includes("Manager Operation Management") && (team.includes("Eco") || team.includes("Micro")))
    return "own_branch";
  return "self";
};

// ─── Quarter Helpers ──────────────────────────────────────────────────────────
const getDaysPassed = () => {
  const start = new Date("2026-07-01");
  const today = new Date();
  const days = Math.floor((today - start) / 86_400_000) + 1;
  return Math.max(0, Math.min(days, 90));
};

const fmtNum = (val, decimals = 2) => {
  const n = Number(val) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
};

// ─── Band Legend Component ────────────────────────────────────────────────────
const BandLegend = () => (
  <Paper
    elevation={0}
    sx={{ p: 2, mb: 3, border: "1px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#fff" }}
  >
    <Typography
      variant="caption"
      sx={{
        fontWeight: 800,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        display: "block",
        mb: 1.5,
      }}
    >
      Performance Threshold Bands
    </Typography>
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {[
        { label: "Below Baseline", range: "< 0%", color: "#C00000" },
        { label: "Severe Underperformance", range: "0–50%", color: "#FF0000" },
        { label: "Underperformance", range: "50–75%", color: "#F58220" },
        { label: "Approaching Target", range: "75–100%", color: "#FFC000" },
        { label: "Target Met", range: "100–120%", color: "#00B050" },
        { label: "Exceptional", range: "≥ 120%", color: "#00AEEF" },
      ].map((b) => (
        <Chip
          key={b.label}
          label={`${b.label}  (${b.range})`}
          size="small"
          sx={{
            bgcolor: b.color,
            color: b.color === "#FFC000" ? "#7a5c00" : "#fff",
            fontWeight: 700,
            fontSize: "0.7rem",
            height: 26,
            borderRadius: 1.5,
          }}
        />
      ))}
    </Stack>
  </Paper>
);

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ icon, label, target, actual, rate, quarterRatio }) => {
  const color = getBandColor(rate);
  const darkText = needsDarkText(rate);
  const expected = target * quarterRatio;
  const gap = actual - expected;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `2px solid ${color}`,
        overflow: "hidden",
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 32px ${color}35`,
        },
      }}
    >
      {/* Colour band accent strip */}
      <Box sx={{ height: 6, bgcolor: color }} />

      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        {/* Header row */}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>
              {icon}
            </Avatar>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#94a3b8",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontSize: "0.62rem",
                }}
              >
                {label}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography
                  variant="h3"
                  fontWeight="900"
                  sx={{ color: "#0f172a", lineHeight: 1.1, fontSize: { xs: "1.9rem", md: "2.4rem" } }}
                >
                  {rate.toFixed(1)}
                </Typography>
                <Typography variant="h5" fontWeight="700" sx={{ color: "#64748b" }}>
                  %
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Chip
            label={getBandLabel(rate)}
            size="small"
            sx={{
              bgcolor: color,
              color: darkText ? "#7a5c00" : "#fff",
              fontWeight: 800,
              fontSize: "0.68rem",
              borderRadius: 1.5,
              height: 24,
            }}
          />
        </Stack>

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(rate, 0), 100)}
          sx={{
            height: 12,
            borderRadius: 6,
            bgcolor: "#f1f5f9",
            mb: 0.5,
            "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 6 },
          }}
        />
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 600 }}>
            0%
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
            Target (100%)
          </Typography>
          <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 600 }}>
            120%
          </Typography>
        </Stack>

        {/* Stats — target shown as of today (pro-rated by days elapsed) */}
        <Grid container spacing={1}>
          {[
            { label: "Target (Today)", value: fmtNum(expected), accent: "#475569" },
            { label: "Actual (YTD)", value: fmtNum(actual), accent: "#475569" },
            {
              label: "Gap vs Expected",
              value: `${gap >= 0 ? "+" : ""}${fmtNum(gap)}`,
              accent: gap >= 0 ? "#00B050" : "#FF0000",
            },
          ].map((s) => (
            <Grid item xs={4} key={s.label}>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", fontWeight: 600, display: "block", fontSize: "0.56rem" }}
              >
                {s.label}
              </Typography>
              <Typography variant="body2" fontWeight="800" sx={{ color: s.accent, lineHeight: 1.2 }}>
                {s.value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ─── Aggregate Breakdown Card ────────────────────────────────────────────────
// Sums target/actual across every row of one breakdown table, so the card is
// always consistent with the table rendered below it.
const AggregateCard = ({ icon, label, unitLabel, rows, quarterRatio }) => {
  const sums = (rows || []).reduce(
    (acc, r) => ({
      depT: acc.depT + (Number(r.depositTarget) || 0),
      depA: acc.depA + (Number(r.depositActual) || 0),
      fcyT: acc.fcyT + (Number(r.fcyTarget) || 0),
      fcyA: acc.fcyA + (Number(r.fcyActual) || 0),
      loanT: acc.loanT + (Number(r.loanTarget) || 0),
      loanA: acc.loanA + (Number(r.loanActual) || 0),
    }),
    { depT: 0, depA: 0, fcyT: 0, fcyA: 0, loanT: 0, loanA: 0 }
  );

  const metrics = [
    { name: "Deposit", target: sums.depT, actual: sums.depA },
    { name: "FCY", target: sums.fcyT, actual: sums.fcyA },
    { name: "Loan Collection", target: sums.loanT, actual: sums.loanA },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        height: "100%",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(15,23,42,0.08)" },
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2, pb: 1.5 }}>
        <Avatar sx={{ bgcolor: "#eef2ff", color: "#1a56db", width: 42, height: 42 }}>
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight="800" color="#1e293b" sx={{ lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="#94a3b8">
            {(rows || []).length} {unitLabel} · aggregate target vs. actual
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ borderColor: "#e2e8f0" }} />

      {/* Metric aggregates side by side: Deposit | FCY | Loan Collection —
          each panel takes exactly one-third of the card width */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
        {metrics.map((m, mi) => {
          const expected = m.target * quarterRatio;
          const rate = expected > 0 ? (m.actual / expected) * 100 : m.actual > 0 ? 100 : 0;
          const gap = m.actual - expected;
          const color = getBandColor(rate);

          return (
            <Box
              key={m.name}
              sx={{
                flex: "1 1 33.33%",
                minWidth: 0,
                p: 2,
                borderLeft: { md: mi > 0 ? "1px solid #e2e8f0" : "none" },
                borderTop: { xs: mi > 0 ? "1px solid #e2e8f0" : "none", md: "none" },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                <Typography
                  variant="caption"
                  fontWeight="800"
                  color="#64748b"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.62rem" }}
                >
                  {m.name}
                </Typography>
                <Chip
                  label={getBandLabel(rate)}
                  size="small"
                  sx={{
                    bgcolor: color,
                    color: needsDarkText(rate) ? "#7a5c00" : "#fff",
                    fontWeight: 800,
                    fontSize: "0.6rem",
                    height: 22,
                    borderRadius: 1.5,
                  }}
                />
              </Stack>

              <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 1 }}>
                <Typography variant="h4" fontWeight="900" sx={{ color: "#0f172a", lineHeight: 1.1 }}>
                  {rate.toFixed(1)}
                </Typography>
                <Typography variant="body2" fontWeight="700" color="#64748b">
                  %
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max(rate, 0), 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "#f1f5f9",
                  mb: 1,
                  "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 },
                }}
              />

              <Grid container spacing={1}>
                {[
                  { label: "Target (Today)", value: fmtNum(expected), accent: "#475569" },
                  { label: "Actual (YTD)", value: fmtNum(m.actual), accent: "#475569" },
                  {
                    label: "Gap vs Expected",
                    value: `${gap >= 0 ? "+" : ""}${fmtNum(gap)}`,
                    accent: gap >= 0 ? "#00B050" : "#FF0000",
                  },
                ].map((s) => (
                  <Grid item xs={4} key={s.label}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#94a3b8", fontWeight: 600, display: "block", fontSize: "0.56rem" }}
                    >
                      {s.label}
                    </Typography>
                    <Typography variant="body2" fontWeight="800" sx={{ color: s.accent, lineHeight: 1.2 }}>
                      {s.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

// ─── Breakdown Table Component ────────────────────────────────────────────────
const BreakdownTable = ({ title, subtitle, rows, emptyMsg, showDistrict = false, quarterRatio = 1 }) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = (rows || []).filter((r) => {
    if (!q) return true;
    return [r.name, r.sub, r.district].some((v) =>
      String(v || "").toLowerCase().includes(q)
    );
  });

  const headers = [
    "#",
    "Name",
    ...(showDistrict ? ["District"] : []),
    "Dep. Target (Today)",
    "Dep. Actual",
    "Deposit Achievement",
    "FCY Target (Today)",
    "FCY Actual",
    "FCY Achievement",
    "Loan Target (Today)",
    "Loan Actual",
    "Loan Achievement",
  ];

  // First column of each metric group gets a divider line so Deposit / FCY /
  // Loan read as three separate blocks
  const groupSx = {
    borderLeft: "2px solid #cbd5e1",
    paddingLeft: 2.5,
  };

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="800" color="#1e293b">
              {title}
            </Typography>
            <Typography variant="caption" color="#94a3b8">
              {subtitle || "Achievement vs. expected pace — colour-coded by performance band"}
              {q && ` · Showing ${filtered.length} of ${(rows || []).length}`}
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              minWidth: 220,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
                fontSize: "0.82rem",
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: "1.1rem", color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Box>
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map((h, hi) => {
                // column indexes where a new metric group starts (FCY, Loan)
                const isFirstOfGroup =
                  h === "FCY Target (Today)" || h === "Loan Target (Today)";
                return (
                  <TableCell
                    key={h}
                    sx={{
                      bgcolor: "#f1f5f9",
                      fontWeight: 800,
                      color: "#64748b",
                      fontSize: "0.68rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      py: 1.5,
                      whiteSpace: "nowrap",
                      ...(isFirstOfGroup ? groupSx : {}),
                    }}
                  >
                    {h}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row, idx) => {
                const dc = getBandColor(row.depositRate);
                const fc = getBandColor(row.fcyRate);
                const lc = getBandColor(row.loanRate);
                return (
                  <TableRow
                    key={idx}
                    sx={{
                      bgcolor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      "&:hover": { bgcolor: "#f0f7ff" },
                      transition: "background 0.15s",
                    }}
                  >
                    <TableCell sx={{ color: "#cbd5e1", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography variant="body2" fontWeight="700" color="#1e293b" sx={{ fontSize: "0.85rem" }}>
                        {row.name}
                      </Typography>
                      {row.sub && (
                        <Typography variant="caption" color="#94a3b8" sx={{ display: "block" }}>
                          {row.sub}
                        </Typography>
                      )}
                    </TableCell>
                    {showDistrict && (
                      <TableCell sx={{ color: "#475569", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {row.district || "—"}
                      </TableCell>
                    )}
                    <TableCell sx={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmtNum(row.depositTarget * quarterRatio)}
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmtNum(row.depositActual)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 170 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(row.depositRate, 0), 100)}
                          sx={{
                            flex: 1,
                            height: 7,
                            borderRadius: 4,
                            bgcolor: "#e2e8f0",
                            "& .MuiLinearProgress-bar": { bgcolor: dc, borderRadius: 4 },
                          }}
                        />
                        <Chip
                          label={`${row.depositRate.toFixed(1)}%`}
                          size="small"
                          sx={{
                            bgcolor: dc,
                            color: needsDarkText(row.depositRate) ? "#7a5c00" : "#fff",
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            height: 22,
                            minWidth: 62,
                            borderRadius: 1,
                          }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ ...groupSx, color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmtNum(row.fcyTarget * quarterRatio)}
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmtNum(row.fcyActual)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 170 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(row.fcyRate, 0), 100)}
                          sx={{
                            flex: 1,
                            height: 7,
                            borderRadius: 4,
                            bgcolor: "#e2e8f0",
                            "& .MuiLinearProgress-bar": { bgcolor: fc, borderRadius: 4 },
                          }}
                        />
                        <Chip
                          label={`${row.fcyRate.toFixed(1)}%`}
                          size="small"
                          sx={{
                            bgcolor: fc,
                            color: needsDarkText(row.fcyRate) ? "#7a5c00" : "#fff",
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            height: 22,
                            minWidth: 62,
                            borderRadius: 1,
                          }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ ...groupSx, color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmtNum(row.loanTarget * quarterRatio)}
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {fmtNum(row.loanActual)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 170 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(row.loanRate, 0), 100)}
                          sx={{
                            flex: 1,
                            height: 7,
                            borderRadius: 4,
                            bgcolor: "#e2e8f0",
                            "& .MuiLinearProgress-bar": { bgcolor: lc, borderRadius: 4 },
                          }}
                        />
                        <Chip
                          label={`${row.loanRate.toFixed(1)}%`}
                          size="small"
                          sx={{
                            bgcolor: lc,
                            color: needsDarkText(row.loanRate) ? "#7a5c00" : "#fff",
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            height: 22,
                            minWidth: 62,
                            borderRadius: 1,
                          }}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="#94a3b8" fontWeight="600">
                    {emptyMsg || "No data available."}
                  </Typography>
                  <Typography variant="caption" color="#cbd5e1" sx={{ display: "block", mt: 0.5 }}>
                    {(rows || []).length > 0 && q
                      ? "No rows match your search."
                      : "Data will appear once the API endpoint is connected for this view."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const MainDashboard = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [depositData, setDepositData] = useState({ target: 0, actual: 0, rate: 0 });
  const [fcyData, setFcyData] = useState({ target: 0, actual: 0, rate: 0 });
  const [loanData, setLoanData] = useState({ target: 0, actual: 0, rate: 0 });
  const [districtBreakdown, setDistrictBreakdown] = useState([]);
  const [amBreakdown, setAmBreakdown] = useState([]);
  const [branchBreakdown, setBranchBreakdown] = useState([]);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const daysPassed = getDaysPassed();
  const quarterRatio = daysPassed / 90;

  const scope = resolveScope(
    user?.title || "",
    user?.position || "",
    user?.organization || "",
    user?.team || ""
  );

  const requestData = !user
    ? {}
    : {
      user_id: user.UserName,
      username: user.UserName,
      user_name: user.UserName,
      position: user.position,
      title: user.title,
      process: user.process || null,
      subprocess: user.subprocess || null,
      team: user.team || null,
      cbsusername: user.cbsusername || null,
      company_code: user.company_code || null,
      organization: user.organization || null,
    };

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch targets — role-aware aggregation via new endpoint
      // - Enterprise/Chiefs: sums all District Director targets (bank-wide)
      // - District Director / Area Manager / Branch Manager: own target only
      const targetRes = await axios.post(
        `${baseUrl}/targets/MainDashboardTargets/`,
        requestData
      );
      console.log("targetRes", targetRes.data);
      const depTarget = Number(targetRes.data?.total_deposit) || 0;
      const fcyTarget = Number(targetRes.data?.total_fcy) || 0;
      const loanTarget = Number(targetRes.data?.total_loan) || 0;
      const expectedDep = depTarget * quarterRatio;
      const expectedFcy = fcyTarget * quarterRatio;
      const expectedLoan = loanTarget * quarterRatio;

      // Per-district / per-branch target lookups returned alongside the
      // summary so breakdown rows show real achievement rates.
      const districtTargetMap = {};
      (targetRes.data?.districtTargets || []).forEach((d) => {
        if (d?.district_name) districtTargetMap[d.district_name] = d;
      });
      const branchTargetMap = {};
      (targetRes.data?.branchTargets || []).forEach((b) => {
        if (b?.branch_code) branchTargetMap[b.branch_code] = b;
      });
      const amTargetMap = {};
      (targetRes.data?.areaManagerTargets || []).forEach((a) => {
        if (a?.user_name) amTargetMap[a.user_name] = a;
      });


      // Fetch actuals from our new dashboard API
      const perfRes = await axios.post(`${baseUrl}/maindashboard/performance`, requestData);
      console.log("perfRes", perfRes.data);
      const perfData = perfRes.data || {};

      const depActual = Number(perfData.summary?.local_deposit) || 0;
      const fcyActual = Number(perfData.summary?.fcy) || 0;
      const loanActual = Number(perfData.summary?.loan_collection) || 0;

      if (perfData.districtBreakdown && perfData.districtBreakdown.length > 0) {
        const mappedDistricts = perfData.districtBreakdown.map((d) => {
          const dt = Number(districtTargetMap[d.district_name]?.deposit_target) || 0;
          const da = Number(d.local_deposit) || 0;
          const expd = dt * quarterRatio;
          const dr = expd > 0 ? (da / expd) * 100 : (da > 0 ? 100 : 0);

          const ft = Number(districtTargetMap[d.district_name]?.fcy_target) || 0;
          const fa = Number(d.fcy) || 0;
          const expf = ft * quarterRatio;
          const fr = expf > 0 ? (fa / expf) * 100 : (fa > 0 ? 100 : 0);

          const lt = Number(districtTargetMap[d.district_name]?.loan_target) || 0;
          const la = Number(d.loan_collection) || 0;
          const expl = lt * quarterRatio;
          const lr = expl > 0 ? (la / expl) * 100 : (la > 0 ? 100 : 0);

          return {
            name: d.district_name,
            depositTarget: dt,
            depositActual: da,
            depositRate: dr,
            fcyTarget: ft,
            fcyActual: fa,
            fcyRate: fr,
            loanTarget: lt,
            loanActual: la,
            loanRate: lr,
          };
        });
        setDistrictBreakdown(mappedDistricts);
      }

      if (perfData.areaManagerBreakdown && perfData.areaManagerBreakdown.length > 0) {
        const mappedAMs = perfData.areaManagerBreakdown.map((a) => {
          const at = amTargetMap[a.user_name] || {};
          const dt = Number(at.deposit_target) || 0;
          const da = Number(a.local_deposit) || 0;
          const expd = dt * quarterRatio;
          const dr = expd > 0 ? (da / expd) * 100 : (da > 0 ? 100 : 0);

          const ft = Number(at.fcy_target) || 0;
          const fa = Number(a.fcy) || 0;
          const expf = ft * quarterRatio;
          const fr = expf > 0 ? (fa / expf) * 100 : (fa > 0 ? 100 : 0);

          const lt = Number(at.loan_target) || 0;
          const la = Number(a.loan_collection) || 0;
          const expl = lt * quarterRatio;
          const lr = expl > 0 ? (la / expl) * 100 : (la > 0 ? 100 : 0);

          return {
            name: a.am_name || a.user_name,
            sub: `${a.branch_count || 0} branch${a.branch_count === 1 ? "" : "es"}`,
            district: a.district_name,
            depositTarget: dt,
            depositActual: da,
            depositRate: dr,
            fcyTarget: ft,
            fcyActual: fa,
            fcyRate: fr,
            loanTarget: lt,
            loanActual: la,
            loanRate: lr,
          };
        });
        setAmBreakdown(mappedAMs);
      } else {
        setAmBreakdown([]);
      }

      if (perfData.branchBreakdown && perfData.branchBreakdown.length > 0) {
        const mappedBranches = perfData.branchBreakdown.map((b) => {
          const bt = branchTargetMap[b.branch_code] || {};
          const dt = Number(bt.deposit_target) || 0;
          const da = Number(b.local_deposit) || 0;
          const expd = dt * quarterRatio;
          const dr = expd > 0 ? (da / expd) * 100 : (da > 0 ? 100 : 0);

          const ft = Number(bt.fcy_target) || 0;
          const fa = Number(b.fcy) || 0;
          const expf = ft * quarterRatio;
          const fr = expf > 0 ? (fa / expf) * 100 : (fa > 0 ? 100 : 0);

          const lt = Number(bt.loan_target) || 0;
          const la = Number(b.loan_collection) || 0;
          const expl = lt * quarterRatio;
          const lr = expl > 0 ? (la / expl) * 100 : (la > 0 ? 100 : 0);

          return {
            name: b.branch_name || b.branch_code,
            sub: b.branch_code,
            district: b.district_name,
            depositTarget: dt,
            depositActual: da,
            depositRate: dr,
            fcyTarget: ft,
            fcyActual: fa,
            fcyRate: fr,
            loanTarget: lt,
            loanActual: la,
            loanRate: lr,
          };
        });
        setBranchBreakdown(mappedBranches);
      } else {
        setBranchBreakdown([]);
      }

      // Achievement rates vs. expected pace
      const depRate = expectedDep > 0 ? (depActual / expectedDep) * 100 : (depActual > 0 ? 100 : 0);
      const fcyRate = expectedFcy > 0 ? (fcyActual / expectedFcy) * 100 : (fcyActual > 0 ? 100 : 0);
      const loanRate = expectedLoan > 0 ? (loanActual / expectedLoan) * 100 : (loanActual > 0 ? 100 : 0);

      setDepositData({ target: depTarget, actual: depActual, rate: depRate });
      setFcyData({ target: fcyTarget, actual: fcyActual, rate: fcyRate });
      setLoanData({ target: loanTarget, actual: loanActual, rate: loanRate });
    } catch (err) {
      console.error("MainDashboard fetchData:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Visibility matrix (per business requirement) ────────────────────────────
  // Enterprise titles (CEO, CCO, District Coordination trio, Talent trio):
  //   3 KPI cards + District / Area Manager / Branch breakdowns + aggregates.
  // C-Suite (position CEO/CHF at Ho): 3 KPI cards + aggregate cards only.
  // District Director: 3 KPI cards + District / AM / Branch breakdowns.
  // Area Manager: 3 KPI cards + District / AM / Branch breakdowns.
  // Branch Manager (incl. Eco MOMs): 3 KPI cards + Branch breakdown only.
  const isEnterpriseLevel = ["enterprise", "all_districts", "enterprise_all"].includes(scope);
  const showDistrictTable = isEnterpriseLevel || scope === "own_district" || scope === "assigned_branches";
  const showAmTable = isEnterpriseLevel || scope === "own_district" || scope === "assigned_branches";
  const showBranchTable =
    isEnterpriseLevel ||
    scope === "own_district" ||
    scope === "assigned_branches" ||
    scope === "own_branch";
  // Aggregate cards: all three for enterprise-level scopes (incl. C-Suite),
  // all three for DD/AM too (their tables feed them), branch-only otherwise.
  const showDistrictAggregate =
    isEnterpriseLevel || scope === "csuite" || scope === "own_district" || scope === "assigned_branches";
  const showAmAggregate = showDistrictAggregate;
  const showBranchAggregate = showDistrictAggregate || scope === "own_branch";

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          gap: 3,
        }}
      >
        <CircularProgress size={60} thickness={3} sx={{ color: "#1a56db" }} />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" fontWeight="700" color="#1e293b">
            Loading Main Dashboard
          </Typography>
          <Typography variant="body2" color="#64748b" sx={{ mt: 0.5 }}>
            Fetching Deposit & FCY performance data…
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f0f4ff 0%, #fafbff 60%, #f0f9ff 100%)",
        p: { xs: 2, md: 3 },
      }}
    >
      {/* ── QUARTER PERIOD STRIP ──────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          bgcolor: "#0284c7",
          boxShadow: "0 12px 32px rgba(2,132,199,0.25)",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 2.5 }, position: "relative", zIndex: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* Quarter info */}
            <Box>
              <Typography
                sx={{
                  color: "rgba(186,230,253,0.55)", fontSize: "0.6rem",
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
                }}
              >
                Quarter Period
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 0.2, flexWrap: "wrap", gap: 0.5 }}>
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.05rem" }}>
                  Q1 FY 2026/27
                </Typography>
                <Typography sx={{ color: "rgba(186,230,253,0.75)", fontSize: "0.8rem" }}>
                  July 1 – September 30, 2026
                </Typography>
              </Stack>
              <Typography
                sx={{ color: "rgba(186,230,253,0.4)", fontSize: "0.58rem", fontWeight: 600, mt: 0.4 }}
              >
                Cooperative Bank of Oromia · Performance Management System
              </Typography>
            </Box>

            {/* Quarter elapsed bar */}
            <Box sx={{ minWidth: { sm: 260 }, width: { xs: "100%", sm: "auto" } }}>
              <LinearProgress
                variant="determinate"
                value={(daysPassed / 90) * 100}
                sx={{
                  height: 5, borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.15)",
                  "& .MuiLinearProgress-bar": { bgcolor: "#4ade80", borderRadius: 3 },
                }}
              />
              <Typography
                sx={{ color: "rgba(186,230,253,0.6)", fontSize: "0.62rem", mt: 0.5, textAlign: { sm: "right" } }}
              >
                Day {daysPassed} of 90 — {((daysPassed / 90) * 100).toFixed(0)}% of quarter elapsed
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ── PERFORMANCE BAND LEGEND ───────────────────────────────────────── */}
      <BandLegend />

      {/* ── KPI SUMMARY CARDS (Deposit · FCY · Loan) ─────────────────────── */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 4 }}>
        <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
          <KpiCard
            icon={<AccountBalanceIcon />}
            label="Deposit Achievement"
            target={depositData.target}
            actual={depositData.actual}
            rate={depositData.rate}
            quarterRatio={quarterRatio}
          />
        </Box>
        <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
          <KpiCard
            icon={<CurrencyExchangeIcon />}
            label="FCY Achievement"
            target={fcyData.target}
            actual={fcyData.actual}
            rate={fcyData.rate}
            quarterRatio={quarterRatio}
          />
        </Box>
        <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
          <KpiCard
            icon={<PaymentsIcon />}
            label="Loan Collection Achievement"
            target={loanData.target}
            actual={loanData.actual}
            rate={loanData.rate}
            quarterRatio={quarterRatio}
          />
        </Box>
      </Box>

      {/* ── AGGREGATE CARDS PER BREAKDOWN (full-width rows) ────────────────── */}
      {(showDistrictAggregate || showAmAggregate || showBranchAggregate) && (
        <Box sx={{ mb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          {showDistrictAggregate && (
            <AggregateCard
              icon={<LocationCityIcon />}
              label="Aggregate District Performance"
              unitLabel="districts"
              rows={districtBreakdown}
              quarterRatio={quarterRatio}
            />
          )}
          {showAmAggregate && (
            <AggregateCard
              icon={<GroupsIcon />}
              label="Aggregate Area Manager Performance"
              unitLabel="area managers"
              rows={amBreakdown}
              quarterRatio={quarterRatio}
            />
          )}
          {showBranchAggregate && (
            <AggregateCard
              icon={<StorefrontIcon />}
              label={
                isEnterpriseLevel
                  ? "Aggregate Branch Performance"
                  : scope === "own_district"
                    ? "Aggregate Branch Performance — Your District"
                    : "Aggregate Branch Performance — Assigned Branches"
              }
              unitLabel="branches"
              rows={branchBreakdown}
              quarterRatio={quarterRatio}
            />
          )}
        </Box>
      )}

      {/* ── DISTRICT BREAKDOWN TABLE ──────────────────────────────────────── */}
      {showDistrictTable && (
        <Box sx={{ mb: 4 }}>
          <BreakdownTable
            title="District Performance Breakdown — Deposit & FCY"
            subtitle="Each district's achievement rate vs. expected pace to date"
            rows={districtBreakdown}
            quarterRatio={quarterRatio}
            emptyMsg="District breakdown data will appear here once the bank-wide API is connected."
          />
        </Box>
      )}

      {/* ── AREA MANAGERS BREAKDOWN TABLE ─────────────────────────────────── */}
      {showAmTable && (
        <Box sx={{ mb: 4 }}>
          <BreakdownTable
            title={
              isEnterpriseLevel
                ? "Area Managers Breakdown — Deposit & FCY"
                : scope === "own_district"
                  ? "Area Managers — Your District"
                  : "Your Performance — Area Manager Scope"
            }
            subtitle="Actuals rolled up from each manager's assigned branches — colour-coded by performance band"
            rows={amBreakdown}
            showDistrict={isEnterpriseLevel}
            quarterRatio={quarterRatio}
            emptyMsg="Area Managers breakdown will appear here once branch mappings and vitals are loaded."
          />
        </Box>
      )}

      {/* ── BRANCH BREAKDOWN TABLE (all / district / assigned / own) ───────── */}
      {showBranchTable && (
        <Box sx={{ mb: 4 }}>
          <BreakdownTable
            title={
              isEnterpriseLevel
                ? "All Branches Breakdown — Deposit & FCY"
                : scope === "own_district"
                  ? "Branch Performance — Your District"
                  : scope === "assigned_branches"
                    ? "Assigned Branches — Deposit & FCY Performance"
                    : "Your Branch — Deposit & FCY Performance"
            }
            subtitle="Branch-level achievement rate vs. expected pace to date"
            rows={branchBreakdown}
            showDistrict={isEnterpriseLevel}
            quarterRatio={quarterRatio}
            emptyMsg="Branch-level breakdown will appear here once the API is connected."
          />
        </Box>
      )}
    </Box>
  );
};

export default MainDashboard;
