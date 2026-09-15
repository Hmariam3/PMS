import React, { useState, useContext, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  Stack,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  PendingActions as PendingIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import axiosOriginal from "axios";
import { AuthContext } from "../AuthContext";
import { toast } from "react-toastify";
import { buildMemberMetrics } from "../utils/metricEngine";
import { calculateMetricScore } from "../utils/scoreCalculator";

const axios = {
  ...axiosOriginal,
  get: (...args) => axiosOriginal.get(...args).catch((err) => {
    console.error("API Error in get:", err);
    return { data: {} };
  }),
  post: (...args) => axiosOriginal.post(...args).catch((err) => {
    console.error("API Error in post:", err);
    return { data: {} };
  }),
};

const DashboardTeam = () => {
  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  // { [user_name]: { metrics, overallScore, priorities } }
  const [memberData, setMemberData] = useState({});
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  // ── Team member list (unchanged) ───────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const res = await axios.post(`${baseUrl}/users/getUserByPostion/`, {
        user_id: user.UserName,
        position: user.position,
        supervisor: user.MailAdress || null,
        process: user.process || null,
        subprocess: user.subprocess || null,
        team: user.team || null,
        cbsusername: user.cbsusername || null,
      });
      let filteredUsers = Array.isArray(res.data) ? res.data : [];
      if (user.position === "Individual") {
        filteredUsers = filteredUsers.filter((u) => u.user_name === user.UserName);
      }

      const positionOrder = {
        "CEO": 1, "CHF": 2, "VP": 3, "Senior Director": 4,
        "Director": 5, "Manager": 6, "CRM": 7, "Individual": 8,
      };
      filteredUsers.sort((a, b) => {
        const orderA = positionOrder[a.position] || 99;
        const orderB = positionOrder[b.position] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });

      setUsers(filteredUsers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Per-member metrics (same pipeline MyDashboard runs for the employee) ───
  const fetchMember = async (member) => {
    const requestData = {
      user_id: member.user_name,
      user_name: member.user_name,
      position: member.position,
      title: member.title,
      process: member.process || null,
      subprocess: member.subprocess || null,
      team: member.team || null,
      cbsusername: member.cbsusername || null,
      company_code: member.company_code || null,
      organization: member.organization || null,
    };

    const [result, priorRes] = await Promise.all([
      buildMemberMetrics(axios, baseUrl, member).catch((err) => {
        console.error(`Metric build failed for ${member.user_name}:`, err);
        return { metrics: [], overallScore: 0 };
      }),
      axios.post(`${baseUrl}/priorities/getPriorityByUser`, requestData),
    ]);

    setMemberData((prev) => ({
      ...prev,
      [member.user_name]: {
        metrics: result.metrics,
        overallScore: result.overallScore,
        priorities: Array.isArray(priorRes.data) ? priorRes.data : [],
      },
    }));
  };

  // Process members in small batches so a large team does not flood the API
  useEffect(() => {
    if (users.length === 0) return;
    let cancelled = false;
    (async () => {
      const BATCH = 4;
      for (let i = 0; i < users.length; i += BATCH) {
        if (cancelled) return;
        await Promise.all(users.slice(i, i + BATCH).map(fetchMember));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const getColor = (value) => {
    if (value >= 100) return "#10b981";
    if (value >= 80) return "#f59e0b";
    return "#ef4444";
  };

  // Supervisor enters a self-report metric value — same scoring math as
  // MyDashboard.handleManualInput, applied to that member's card live.
  const handleMemberInput = (memberName, idx, val) => {
    const num = parseFloat(val) || 0;
    setMemberData((prev) => {
      const entry = prev[memberName];
      if (!entry) return prev;
      const metrics = entry.metrics.map((m, i) => {
        if (i !== idx) return m;
        const targetTo = m.expected === 0 ? 1 : m.expected;
        const scoreObj = calculateMetricScore(m.metric, num, targetTo);
        return {
          ...m,
          actual: num,
          rate: m.expected > 0 ? (num / m.expected) * 100 : 0,
          score: scoreObj.score || 0,
        };
      });
      const overallScore = metrics
        .filter((x) => x.actual !== null)
        .reduce((s, x) => s + (Number(x.score) || 0), 0);
      return { ...prev, [memberName]: { ...entry, metrics, overallScore } };
    });
  };
  const getGradient = (value) => {
    if (value >= 100) return "linear-gradient(135deg, #059669, #10b981)";
    if (value >= 80) return "linear-gradient(135deg, #d97706, #f59e0b)";
    return "linear-gradient(135deg, #dc2626, #ef4444)";
  };
  const fmtNum = (n) =>
    Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });

  const getOrgLabel = (u) => {
    if (["CRM", "Individual", "Manager"].includes(u.position)) return u.team;
    if (["Director", "Senior Director"].includes(u.position)) return u.subprocess;
    if (["VP", "CHF"].includes(u.position)) return u.process;
    return u.team;
  };

  const teamSummary = useMemo(() => {
    const loaded = Object.values(memberData);
    if (loaded.length === 0) return null;
    const avgScore = loaded.reduce((s, m) => s + (m.overallScore || 0), 0) / loaded.length;
    const excellent = loaded.filter((m) => (m.overallScore || 0) >= 100).length;
    const needsInput = loaded.filter((m) => m.metrics.some((x) => x.actual === null)).length;
    return { loadedCount: loaded.length, avgScore, excellent, needsInput };
  }, [memberData]);

  const showPriorities =
    user.organization === "Ho" ||
    user.position === "Director" ||
    user.position === "Senior Director";

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100%", fontFamily: "sans-serif" }}>
      {/* ── HEADER ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="700" color="#1e293b">
          Team Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time tracking of KPIs, and system performance
        </Typography>
      </Box>

      {/* ── SUMMARY STRIP ── */}
      {teamSummary && (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            { label: "Team Members", value: users.length, sub: `${teamSummary.loadedCount} loaded`, icon: <GroupIcon />, color: "#3b82f6" },
            { label: "Avg. Overall Score", value: `${teamSummary.avgScore.toFixed(1)}`, sub: "out of 100", icon: <TrendingUpIcon />, color: "#10b981" },
            { label: "At 100%+", value: teamSummary.excellent, sub: "members fully achieved", icon: <EmojiEventsIcon />, color: "#8b5cf6" },
            { label: "Awaiting Input", value: teamSummary.needsInput, sub: "members with self-report metrics", icon: <PendingIcon />, color: "#f59e0b" },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: stat.color, width: 44, height: 44 }}>{stat.icon}</Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.62rem" }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b", lineHeight: 1.15 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="#94a3b8" sx={{ fontWeight: 600 }}>{stat.sub}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── MEMBER CARDS ── */}
      <Stack spacing={3}>
        {users.map((u) => {
          const data = memberData[u.user_name];

          return (
            <Card key={u.user_name} elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", transition: "0.3s", "&:hover": { boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)" } }}>
              <CardContent sx={{ p: 4 }}>
                {/* User header */}
                <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 3 }}>
                  <Avatar sx={{ width: 72, height: 72, bgcolor: "#f1f5f9", color: "#1e293b", fontWeight: 600, fontSize: "1.4rem" }}>
                    {u.full_name?.split(" ").map((n) => n[0]).join("")}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: "#1e293b" }}>{u.full_name}</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                      <Chip label={u.position} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: 2 }} />
                      <Chip label={getOrgLabel(u)} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 2 }} />
                    </Stack>
                  </Box>
                  {data && (
                    <Box
                      sx={{
                        px: 2.5, py: 1.2, borderRadius: 3, textAlign: "center", minWidth: 120,
                        background: getGradient(data.overallScore),
                        boxShadow: `0 6px 16px ${getColor(data.overallScore)}55`,
                      }}
                    >
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 800, letterSpacing: 1.5 }}>
                        OVERALL SCORE
                      </Typography>
                      <Typography sx={{ color: "#fff", fontSize: "1.6rem", fontWeight: 900, lineHeight: 1.1 }}>
                        {data.overallScore.toFixed(1)}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.65rem", fontWeight: 700 }}>
                        out of 100
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Metrics */}
                {!data ? (
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 4, justifyContent: "center" }}>
                    <CircularProgress size={26} sx={{ color: "#0284c7" }} />
                    <Typography variant="body2" color="text.secondary">Loading metrics for this member…</Typography>
                  </Stack>
                ) : data.metrics.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 5, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 3, border: "1px dashed #cbd5e1" }}>
                    <Typography variant="body1" color="textSecondary" fontStyle="italic">
                      No metrics are assigned to this member's profile.
                    </Typography>
                  </Paper>
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: "#1e293b", textTransform: "uppercase", letterSpacing: 1 }}>
                      Metric Achievements
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {data.metrics.map((m, idx) => {
                        const isUser = m.inputBy === "User";
                        const statusColor = getColor(m.rate);
                        return (
                          <Paper
                            key={idx}
                            elevation={0}
                            sx={{
                              width: "calc(25% - 12px)",
                              minWidth: 230,
                              p: 2.2,
                              borderRadius: 3,
                              border: "1px solid",
                              borderColor: isUser ? "#fde68a" : "#e8edf5",
                              background: isUser
                                ? "linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)"
                                : "linear-gradient(135deg, #f8faff 0%, #ffffff 100%)",
                              position: "relative",
                              overflow: "hidden",
                              "&::before": m.actual !== null ? {
                                content: '""', position: "absolute", top: 0, left: 0, right: 0, height: 3,
                                background: getGradient(m.rate),
                              } : {},
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
                                <Box sx={{
                                  width: 38, height: 38, borderRadius: 2, flexShrink: 0,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  background: isUser ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                  fontSize: "1.2rem",
                                }}>
                                  {m.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight="800" color="#1e293b" noWrap sx={{ lineHeight: 1.25 }}>
                                    {m.name}
                                  </Typography>
                                  <Chip
                                    label={isUser ? "Self Report" : "System"}
                                    size="small"
                                    icon={isUser
                                      ? <EditIcon sx={{ fontSize: "9px !important" }} />
                                      : <CheckCircleIcon sx={{ fontSize: "9px !important" }} />}
                                    sx={{
                                      height: 17, mt: 0.3, fontSize: "0.58rem", fontWeight: 700,
                                      bgcolor: isUser ? "#fef3c7" : "#eff6ff",
                                      color: isUser ? "#92400e" : "#1d4ed8",
                                    }}
                                  />
                                </Box>
                              </Stack>
                              <Box sx={{
                                px: 1.2, py: 0.4, borderRadius: 1.8, flexShrink: 0,
                                background: m.actual !== null ? getGradient(m.rate) : "linear-gradient(135deg, #94a3b8, #64748b)",
                                minWidth: 52, textAlign: "center",
                              }}>
                                <Typography sx={{ fontWeight: 900, color: "#fff", fontSize: "0.78rem", lineHeight: 1.2 }}>
                                  {m.actual !== null ? `${m.rate.toFixed(1)}%` : "—"}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.6 }}>
                              {isUser ? (
                                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0 }}>
                                  <input
                                    type="number"
                                    min="0"
                                    value={m.actual !== null ? m.actual : ""}
                                    onChange={(e) => handleMemberInput(u.user_name, idx, e.target.value)}
                                    placeholder="Enter actual"
                                    style={{
                                      width: 88, padding: "4px 8px",
                                      border: "1.5px solid #fbbf24",
                                      borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
                                      outline: "none", background: "#fffdf0", color: "#78350f",
                                    }}
                                  />
                                  <Typography variant="caption" color="#78350f" fontWeight="700" noWrap>
                                    / {m.expected > 0 ? fmtNum(m.expected) : "N/A"}
                                  </Typography>
                                </Stack>
                              ) : (
                                <Typography variant="caption" fontWeight="700" color="#64748b" noWrap>
                                  {`${fmtNum(m.actual)} / ${m.expected > 0 ? fmtNum(m.expected) : "N/A"}`}
                                </Typography>
                              )}
                              {m.weight > 0 && (
                                <Typography variant="caption" fontWeight="700" color="#94a3b8" sx={{ flexShrink: 0 }}>
                                  {m.weight}% wt
                                </Typography>
                              )}
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={m.actual !== null ? Math.min(Math.max(m.rate, 0), 100) : 0}
                              sx={{
                                height: 7, borderRadius: 4,
                                bgcolor: "#f1f5f9",
                                "& .MuiLinearProgress-bar": { bgcolor: m.actual !== null ? statusColor : "#cbd5e1", borderRadius: 4 },
                              }}
                            />
                          </Paper>
                        );
                      })}
                    </Box>
                  </>
                )}

                {/* Priorities */}
                {showPriorities && data && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 4, mb: 2, color: "#1e293b", textTransform: "uppercase", letterSpacing: 1 }}>
                      Weekly Priorities
                    </Typography>
                    <Grid container spacing={2.5}>
                      {data.priorities.length > 0 ? (
                        data.priorities.map((pr, i) => (
                          <Grid item xs={12} sm={6} md={4} key={i}>
                            <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0", height: "100%" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1b3fcd", mb: 1, borderLeft: "4px solid #1b3fcd", pl: 1.5 }}>
                                {pr.priority_name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.6 }}>
                                {pr.detail}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))
                      ) : (
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 3, border: "1px dashed #cbd5e1" }}>
                            <Typography variant="body2" color="textSecondary" fontStyle="italic">
                              No active priorities listed for this week
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default DashboardTeam;
