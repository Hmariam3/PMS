import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: 900 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const UserObjectiveEvaluations = () => {
  const { user } = useContext(AuthContext);

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackDetails, setFeedbackDetails] = useState([]);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/evaluations/getByEvaluator`, {
        evaluator: user.MailAdress,
      });
      const data = res.data;
      loadEachEvaluated(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch evaluations");
    } finally {
      setLoading(false);
    }
  };

  const loadEachEvaluated = async (evaluatedUsers) => {
    try {
      const results = await Promise.all(
        evaluatedUsers.map(async (emp) => {
          const res = await axios.post(`${baseUrl}/evaluations/getByEvaluatedUser`, {
            evaluated: emp.evaluated, evaluator: user.MailAdress
          });
          const evaluationsData = res.data;




          const grouped = evaluationsData.reduce((acc, item) => {
            const key = item.objective_name;
            if (!acc[key]) {
              acc[key] = {
                objective_name: item.objective_name,
                objective_weight: Number(item.objective_weight || 100),
                total_score: 0,
                metrics: [],
              };
            }
            // console.log("item", item);

            acc[key].metrics.push({
              ...item,
              score:
                item.cap === "cap1"
                  ? Number(item.weight || 0)
                  : item.cap === "cap4"
                    ? (Number(item.weight || 0) * 100) / 4
                    : (item.cap === "cap5" || item.cap === null)
                      ? (Number(item.weight || 0) * 100) / 5
                      : 0,
            });
            acc[key].total_score += Number(item.weight || 0);
            return acc;
          }, {});

          // Object.values(grouped).forEach((obj) => {
          //   // if (obj.total_score > obj.objective_weight) {
          //   //   obj.total_score = obj.objective_weight;
          //   // }
          //   obj.total_score = (obj.total_score * 100) / 5;
          // });

          Object.values(grouped).forEach((obj) => {
            obj.total_score = obj.metrics.reduce(
              (sum, metric) => sum + Number(metric.score || 0),
              0
            );
          });

          const total_score = Object.values(grouped).reduce((sum, obj) => sum + obj.total_score, 0);

          return {
            evaluated: emp,
            data: Object.values(grouped),
            total_score,
          };
        }),
      );
      setEvaluations(results);
    } catch (err) {
      console.error(err);
      toast.error("Failed loading evaluated users");
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleShowDetails = async (userData) => {
    setSelectedUser(userData);
    setShowModal(true);
    try {
      const res = await axios.get(
        `${baseUrl}/feedbacks/getByUserFeedbacks/${userData.evaluated.outlook_address}`,
      );
      setFeedbackDetails(res.data);
    } catch (err) {
      console.error("Error loading feedback:", err);
      toast.error("Failed to load feedback details");
    }
  };

  const handleAgree = async (userData) => {
    try {
      const score = userData.total_score;
      const performance_status = score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Need Improvement";
      const recommendation = getInformativeToDo(userData);

      const payload = {
        username: user.MailAdress,
        fullname: userData.evaluated.evaluated_full_name,
        mail: userData.evaluated.evaluated,
        employee_id: userData.evaluated.employee_id,
        process: userData.evaluated.process,
        subprocess: userData.evaluated.subprocess,
        branch: userData.evaluated.branch,
        performance_result: score,
        performance_status: performance_status,
        strategic_recommendation: recommendation,
        created_by: user.MailAdress
      };

      await axios.post(`${baseUrl}/evaluations/agree`, payload);
      toast.success("Evaluation agreed successfully!");
      setShowModal(false);
      fetchEvaluations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to agree on evaluation");
    }
  };

  const getStatusChip = (score) => {
    if (score >= 80) return <Chip label="Excellent" color="success" size="small" />;
    if (score >= 50) return <Chip label="Good" color="warning" size="small" />;
    return <Chip label="Need Improvement" color="error" size="small" />;
  };

  const getInformativeToDo = (userData) => {
    const { total_score, data } = userData;

    if (total_score >= 85) {
      return "Sustaining Excellence: You are exceeding expectations. Focus on knowledge sharing and potentially expanding your scope of responsibility.";
    }

    if (total_score >= 75) {
      return "High Potential: Great results. To push into the top tier, look for micro-optimizations in your core workflows.";
    }

    // Find objective with lowest relative performance
    const lowestObj = [...data].sort((a, b) => {
      const ratioA = a.total_score / (a.objective_weight || 1);
      const ratioB = b.total_score / (b.objective_weight || 1);
      return ratioA - ratioB;
    })[0];

    if (total_score >= 50) {
      return `Good Progress: Focus your efforts on "${lowestObj?.objective_name || 'core objectives'}" to improve your overall rating. Consistency is key here.`;
    }

    return `Action Required: Prioritize a deep dive into "${lowestObj?.objective_name || 'your performance metrics'}" and collaborate with your lead to resolve specific bottlenecks.`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Employee Evaluations
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">Evaluations</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table hover>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sub Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Objectives</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Recommendation</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((u, index) => (
                <TableRow key={u.evaluated?.employee_id || index} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {u.evaluated?.evaluated_full_name || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {u.evaluated?.employee_id || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>{u.evaluated?.process || "-"}</TableCell>
                  <TableCell>{u.evaluated?.subprocess || "-"}</TableCell>
                  <TableCell>{u.evaluated?.branch || "-"}</TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      {u.data.map((obj, i) => (
                        <Box key={i}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {obj.objective_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {obj.total_score.toFixed(2)} / {obj.objective_weight}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{u.total_score.toFixed(2)}</TableCell>
                  <TableCell>{getStatusChip(u.total_score)}</TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.primary", fontStyle: "italic", lineHeight: 1.4 }}>
                      {getInformativeToDo(u)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Details">
                      <IconButton
                        color="info"
                        size="small"
                        onClick={() => handleShowDetails(u)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Details Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showModal}>
          <Box sx={modalStyle} id="print-modal">
            <style>
              {`
                @media print {
                  body {
                    overflow: visible !important;
                  }
                  body * {
                    visibility: hidden;
                  }
                  .MuiModal-root {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    overflow: visible !important;
                  }
                  .MuiBackdrop-root {
                    display: none !important;
                  }
                  #print-modal, #print-modal * {
                    visibility: visible;
                  }
                  #print-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-height: none !important;
                    height: auto !important;
                    overflow: visible !important;
                    transform: none !important;
                    box-shadow: none !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}
            </style>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                  {selectedUser?.evaluated?.evaluated_full_name || "Performance Review"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detailed performance metrics and strategic recommendations
                </Typography>
              </Box>
              <Chip
                label={selectedUser?.evaluated?.status?.toLowerCase() === 'agreed' ? 'Agreed' : 'Not Agreed Yet'}
                color={selectedUser?.evaluated?.status?.toLowerCase() === 'agreed' ? 'success' : 'default'}
                variant={selectedUser?.evaluated?.status?.toLowerCase() === 'agreed' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Divider sx={{ mb: 3 }} />

            {selectedUser && (
              <Grid container spacing={4}>
                {/* Left Column: Info & Recommendations */}
                <Grid item xs={12} md={5}>
                  <Stack spacing={3}>
                    {/* Status Overview Card */}
                    <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Performance Status
                          </Typography>
                          {getStatusChip(selectedUser.total_score)}
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", mb: 0.5 }}>
                          {selectedUser.total_score.toFixed(2)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Overall weighted score across all objectives
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Recommendations Card */}
                    <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: "4px solid", borderLeftColor: "primary.main" }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "primary.main", textTransform: "uppercase", fontSize: "0.75rem" }}>
                          Strategic Recommendations
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6, color: "text.primary", fontWeight: 500 }}>
                          {getInformativeToDo(selectedUser)}
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Employee Info Card */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, pl: 1 }}>
                        Employee Profile
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "white" }}>
                        <Stack spacing={1.5}>

                          {[
                            { label: "Full Name", value: selectedUser.evaluated?.evaluated_full_name },
                            { label: "Email", value: selectedUser.evaluated?.evaluated },
                            { label: "Employee ID", value: selectedUser.evaluated?.employee_id },
                            { label: "Title", value: selectedUser.evaluated?.title },
                            { label: "Position", value: selectedUser.evaluated?.position },
                            { label: "Process", value: selectedUser.evaluated?.process },
                            { label: "Sub Process", value: selectedUser.evaluated?.subprocess },
                            { label: "Branch", value: selectedUser.evaluated?.branch },
                          ].map((item, idx) => (
                            <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                                {item.value || "N/A"}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Box>

                    {/* Feedback History */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, pl: 1 }}>
                        Feedback Log
                      </Typography>
                      <Stack spacing={2}>
                        {feedbackDetails.length === 0 ? (
                          <Typography variant="caption" color="text.secondary" align="center" sx={{ py: 3, display: "block", bgcolor: "#f8fafc", borderRadius: 2 }}>
                            No formal feedback entries recorded
                          </Typography>
                        ) : (
                          feedbackDetails.map((fb) => (
                            <Card key={fb.id} variant="outlined" sx={{ borderRadius: 3, "&:hover": { boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" } }}>
                              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                                    {fb.subject}
                                  </Typography>
                                  <Chip label={fb.status} size="small" color={fb.status === "Closed" ? "default" : "info"} sx={{ height: 20, fontSize: "0.65rem" }} />
                                </Box>
                                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", mb: 1.5 }}>
                                  {fb.message}
                                </Typography>
                                <Box sx={{ pt: 1, borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                                    {new Date(fb.created_at).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.light" }}>
                                    {fb.sender}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Column: Breakdown */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, pl: 1 }}>
                    Performance Breakdown by Objective
                  </Typography>
                  <Stack spacing={2.5}>
                    {selectedUser.data?.map((obj, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 0, borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ p: 2, bgcolor: "#f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>
                            {obj.objective_name}
                          </Typography>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                              {obj.total_score.toFixed(2)} / {obj.objective_weight}
                            </Typography>
                            <Box sx={{ width: 100, height: 4, bgcolor: "#cbd5e1", borderRadius: 2, mt: 0.5, overflow: "hidden" }}>
                              <Box sx={{ width: `${Math.min((obj.total_score / obj.objective_weight) * 100, 100)}%`, height: "100%", bgcolor: "primary.main" }} />
                            </Box>
                          </Box>
                        </Box>
                        <TableContainer sx={{ p: 1 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary" }}>METRIC</TableCell>
                                <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary" }} align="right">VALUE</TableCell>
                                <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary" }} align="right">SCORE</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {obj.metrics?.map((m, idx) => (
                                <TableRow key={idx} sx={{ "&:last-child td": { border: 0 } }}>
                                  <TableCell sx={{ fontSize: "0.75rem", py: 1.5 }}>{m.metric_name}</TableCell>
                                  <TableCell sx={{ fontSize: "0.75rem" }} align="right">{m.evaluation_value}</TableCell>
                                  <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }} align="right">{Number(m.score || 0).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }} className="no-print">
              <Button variant="outlined" color="primary" onClick={() => window.print()}>
                Print
              </Button>
              {selectedUser?.evaluated?.status !== 'agreed' && selectedUser?.evaluated?.evaluated === user.MailAdress && (
                <Button variant="contained" color="success" onClick={() => handleAgree(selectedUser)}>
                  Agree
                </Button>
              )}
              <Button variant="contained" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Loading Overlay */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default UserObjectiveEvaluations;
