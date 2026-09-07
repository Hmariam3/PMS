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
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
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
const resolveScope = (title = "", position = "", organization = "") => {
  if (["Chief Executive Officer", "Chief, Commercial Officer"].includes(title))
    return "enterprise";
  if (title.toLowerCase().startsWith("chief"))
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
    title === "District Director" ||
    ((position === "Director" || position === "Senior Director") &&
      organization === "Do")
  )
    return "own_district";
  if (title === "Area Manager") return "assigned_branches";
  if (title.includes("Branch Manager")) return "own_branch";
  return "self";
};

const SCOPE_META = {
  enterprise: { label: "Enterprise — Bank-Wide View", icon: "🏦" },
  csuite: { label: "Executive — Bank-Wide View", icon: "🏦" },
  all_districts: { label: "All Districts View", icon: "🗺️" },
  enterprise_all: { label: "Enterprise — Full Visibility", icon: "🔭" },
  own_district: { label: "District View", icon: "🏢" },
  assigned_branches: { label: "Assigned Branches View", icon: "🏪" },
  own_branch: { label: "Branch View", icon: "🏬" },
  self: { label: "Individual View", icon: "👤" },
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

        {/* Four stats */}
        <Grid container spacing={1.5}>
          {[
            { label: "Qtr Target", value: fmtNum(target), sub: "ETB" },
            { label: "Expected Today", value: fmtNum(expected), sub: `Day ${getDaysPassed()} / 90` },
            { label: "Actual (YTD)", value: fmtNum(actual), sub: "ETB" },
            {
              label: "Gap vs Expected",
              value: `${gap >= 0 ? "+" : ""}${fmtNum(gap)}`,
              sub: gap >= 0 ? "▲ Ahead of pace" : "▼ Behind pace",
              accent: gap >= 0 ? "#00B050" : "#FF0000",
            },
          ].map((item, i) => (
            <Grid item xs={6} key={i}>
              <Paper
                elevation={0}
                sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e8ecf0" }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", fontWeight: 600, display: "block", fontSize: "0.6rem", mb: 0.3 }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight="800"
                  sx={{ color: item.accent || "#1e293b", lineHeight: 1.2 }}
                >
                  {item.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "0.6rem" }}>
                  {item.sub}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ─── Breakdown Table Component ────────────────────────────────────────────────
const BreakdownTable = ({ title, subtitle, rows, emptyMsg }) => (
  <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
    <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
      <Typography variant="subtitle1" fontWeight="800" color="#1e293b">
        {title}
      </Typography>
      <Typography variant="caption" color="#94a3b8">
        {subtitle || "Achievement vs. expected pace — colour-coded by performance band"}
      </Typography>
    </Box>
    <TableContainer sx={{ maxHeight: 520 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {[
              "#",
              "Name",
              "Dep. Target",
              "Dep. Actual",
              "Deposit Achievement",
              "FCY Target",
              "FCY Actual",
              "FCY Achievement",
            ].map((h) => (
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
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows && rows.length > 0 ? (
            rows.map((row, idx) => {
              const dc = getBandColor(row.depositRate);
              const fc = getBandColor(row.fcyRate);
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
                  <TableCell sx={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                    {fmtNum(row.depositTarget)}
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
                  <TableCell sx={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                    {fmtNum(row.fcyTarget)}
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
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" color="#94a3b8" fontWeight="600">
                  {emptyMsg || "No data available."}
                </Typography>
                <Typography variant="caption" color="#cbd5e1" sx={{ display: "block", mt: 0.5 }}>
                  Data will appear once the API endpoint is connected for this view.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const MainDashboard = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [depositData, setDepositData] = useState({ target: 0, actual: 0, rate: 0 });
  const [fcyData, setFcyData] = useState({ target: 0, actual: 0, rate: 0 });
  const [districtBreakdown, setDistrictBreakdown] = useState([]);
  const [branchBreakdown, setBranchBreakdown] = useState([]);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const daysPassed = getDaysPassed();
  const quarterRatio = daysPassed / 90;

  const scope = resolveScope(
    user?.title || "",
    user?.position || "",
    user?.organization || ""
  );
  const meta = SCOPE_META[scope] || SCOPE_META.self;

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
      const expectedDep = depTarget * quarterRatio;
      const expectedFcy = fcyTarget * quarterRatio;


      // Fetch actuals from our new dashboard API
      const perfRes = await axios.post(`${baseUrl}/maindashboard/performance`, requestData);
      console.log("perfRes", perfRes.data);
      const perfData = perfRes.data || {};

      const depActual = Number(perfData.summary?.local_deposit) || 0;
      const fcyActual = Number(perfData.summary?.fcy) || 0;

      if (perfData.districtBreakdown && perfData.districtBreakdown.length > 0) {
        const mappedDistricts = perfData.districtBreakdown.map(d => {
          // For now, setting target to 0 for districts until district target API is clear
          const dt = 0;
          const da = Number(d.local_deposit) || 0;
          const expd = dt * quarterRatio;
          const dr = expd > 0 ? (da / expd) * 100 : (da > 0 ? 100 : 0);

          const ft = 0;
          const fa = Number(d.fcy) || 0;
          const expf = ft * quarterRatio;
          const fr = expf > 0 ? (fa / expf) * 100 : (fa > 0 ? 100 : 0);

          return {
            name: d.district_name,
            depositTarget: dt,
            depositActual: da,
            depositRate: dr,
            fcyTarget: ft,
            fcyActual: fa,
            fcyRate: fr,
          };
        });
        setDistrictBreakdown(mappedDistricts);
      }

      if (perfData.branchBreakdown && perfData.branchBreakdown.length > 0) {
        const mappedBranches = perfData.branchBreakdown.map(b => {
          const dt = 0;
          const da = Number(b.local_deposit) || 0;
          const expd = dt * quarterRatio;
          const dr = expd > 0 ? (da / expd) * 100 : (da > 0 ? 100 : 0);

          const ft = 0;
          const fa = Number(b.fcy) || 0;
          const expf = ft * quarterRatio;
          const fr = expf > 0 ? (fa / expf) * 100 : (fa > 0 ? 100 : 0);

          return {
            name: b.branch_name || b.branch_code,
            sub: b.branch_code,
            depositTarget: dt,
            depositActual: da,
            depositRate: dr,
            fcyTarget: ft,
            fcyActual: fa,
            fcyRate: fr,
          };
        });
        setBranchBreakdown(mappedBranches);
      }

      // Achievement rates vs. expected pace
      const depRate = expectedDep > 0 ? (depActual / expectedDep) * 100 : (depActual > 0 ? 100 : 0);
      const fcyRate = expectedFcy > 0 ? (fcyActual / expectedFcy) * 100 : (fcyActual > 0 ? 100 : 0);

      setDepositData({ target: depTarget, actual: depActual, rate: depRate });
      setFcyData({ target: fcyTarget, actual: fcyActual, rate: fcyRate });
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

  const showDistrictTable = ["enterprise", "csuite", "all_districts", "enterprise_all"].includes(scope);
  const showBranchTable = scope === "own_district" || scope === "assigned_branches";

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
      {/* ── HERO HEADER ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(135deg, #0a2463 0%, #1a56db 55%, #0d9488 100%)",
          boxShadow: "0 20px 60px rgba(26,86,219,0.28)",
        }}
      >
        {/* Decorative blobs */}
        <Box
          sx={{
            position: "absolute", top: -50, right: -50,
            width: 240, height: 240, borderRadius: "50%",
            background: "rgba(13,148,136,0.18)", filter: "blur(50px)", pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute", bottom: -30, left: "25%",
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(26,86,219,0.18)", filter: "blur(40px)", pointerEvents: "none",
          }}
        />

        <Box sx={{ p: { xs: 2, md: 3.5 }, position: "relative", zIndex: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* Left: Identity */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  width: 58, height: 58, fontSize: "1.6rem",
                  bgcolor: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.25)",
                }}
              >
                {meta.icon}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.58rem", fontWeight: 800, letterSpacing: 2,
                    color: "rgba(186,230,253,0.65)", textTransform: "uppercase",
                  }}
                >
                  Main Dashboard · Deposit & FCY Performance
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="900"
                  sx={{ color: "#fff", lineHeight: 1.2, mt: 0.3 }}
                >
                  {user?.FullName || user?.UserName || "Welcome"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.8, flexWrap: "wrap", gap: 0.5 }}>
                  <Chip
                    label={user?.title || user?.position || "User"}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)", color: "#e0f2fe",
                      fontWeight: 700, fontSize: "0.65rem",
                      border: "1px solid rgba(255,255,255,0.2)", height: 22,
                    }}
                  />
                  <Chip
                    label={meta.label}
                    size="small"
                    sx={{
                      bgcolor: "rgba(13,148,136,0.3)", color: "#99f6e4",
                      fontWeight: 700, fontSize: "0.65rem",
                      border: "1px solid rgba(13,148,136,0.35)", height: 22,
                    }}
                  />
                </Stack>
              </Box>
            </Stack>

            {/* Right: Quarter status */}
            <Box sx={{ textAlign: { sm: "right" }, minWidth: 200 }}>
              <Typography
                sx={{
                  color: "rgba(186,230,253,0.55)", fontSize: "0.6rem",
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
                }}
              >
                Quarter Period
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1rem", mt: 0.2 }}>
                Q1 FY 2026/27
              </Typography>
              <Typography sx={{ color: "rgba(186,230,253,0.75)", fontSize: "0.75rem" }}>
                July 1 – September 30, 2026
              </Typography>

              {/* Quarter elapsed bar */}
              <Box sx={{ mt: 1.2 }}>
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
                  sx={{ color: "rgba(186,230,253,0.6)", fontSize: "0.62rem", mt: 0.5 }}
                >
                  Day {daysPassed} of 90 — {((daysPassed / 90) * 100).toFixed(0)}% of quarter elapsed
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />
              <Typography
                sx={{ color: "rgba(186,230,253,0.4)", fontSize: "0.58rem", fontWeight: 600 }}
              >
                Cooperative Bank of Oromia · Performance Management System
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ── PERFORMANCE BAND LEGEND ───────────────────────────────────────── */}
      <BandLegend />

      {/* ── KPI SUMMARY CARDS (Deposit & FCY) ───────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <KpiCard
            icon={<AccountBalanceIcon />}
            label="Deposit Achievement"
            target={depositData.target}
            actual={depositData.actual}
            rate={depositData.rate}
            quarterRatio={quarterRatio}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            icon={<CurrencyExchangeIcon />}
            label="FCY Achievement"
            target={fcyData.target}
            actual={fcyData.actual}
            rate={fcyData.rate}
            quarterRatio={quarterRatio}
          />
        </Grid>
      </Grid>

      {/* ── DISTRICT BREAKDOWN TABLE ──────────────────────────────────────── */}
      {showDistrictTable && (
        <Box sx={{ mb: 4 }}>
          <BreakdownTable
            title="District Performance Breakdown — Deposit & FCY"
            subtitle="Each district's achievement rate vs. expected quarterly pace"
            rows={districtBreakdown}
            emptyMsg="District breakdown data will appear here once the bank-wide API is connected."
          />
        </Box>
      )}

      {/* ── BRANCH BREAKDOWN TABLE ────────────────────────────────────────── */}
      {showBranchTable && (
        <Box sx={{ mb: 4 }}>
          <BreakdownTable
            title={
              scope === "own_district"
                ? "Branch Performance — Your District"
                : "Assigned Branches — Deposit & FCY Performance"
            }
            subtitle="Branch-level achievement rate vs. expected quarterly pace"
            rows={branchBreakdown}
            emptyMsg="Branch-level breakdown will appear here once the API is connected."
          />
        </Box>
      )}
    </Box>
  );
};

export default MainDashboard;
