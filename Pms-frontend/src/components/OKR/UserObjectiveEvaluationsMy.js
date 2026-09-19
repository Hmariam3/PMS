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
import { Print as PrintIcon } from "@mui/icons-material";
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

const UserObjectiveEvaluationsMy = () => {
  const { user } = useContext(AuthContext);

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [feedbackDetails, setFeedbackDetails] = useState([]);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const loadEachEvaluated = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/evaluations/getByEvaluatedUser`, {
        evaluated: user.MailAdress,
      });
      const evaluationsData = res.data || [];

      if (evaluationsData.length === 0) {
        setEvaluations([]);
        return;
      }

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

      Object.values(grouped).forEach((obj) => {
        obj.total_score = obj.metrics.reduce(
          (sum, metric) => sum + Number(metric.score || 0),
          0
        );
      });

      const total_score = Object.values(grouped).reduce((sum, obj) => sum + obj.total_score, 0);

      const firstEval = evaluationsData[0] || {};
      const allAgreed = evaluationsData.length > 0 && evaluationsData.every(item => item.status?.toLowerCase() === 'agreed');

      const evaluatedUser = {
        evaluated_full_name: user.FullName,
        evaluated: user.MailAdress,
        employee_id: firstEval.employee_id || "-",
        title: firstEval.title || "-",
        position: firstEval.position || "-",
        process: firstEval.process || "-",
        subprocess: firstEval.subprocess || "-",
        branch: firstEval.branch || "-",
        status: allAgreed ? 'agreed' : null,
        outlook_address: user.MailAdress,
        evaluator_full_name: firstEval.evaluator_full_name,
      };

      const result = {
        evaluated: evaluatedUser,
        data: Object.values(grouped),
        total_score,
      };

      setEvaluations([result]);
    } catch (err) {
      console.error(err);
      toast.error("Failed loading evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.MailAdress) {
      loadEachEvaluated();
    }
  }, [user]);

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
    if (isAgreeing) return;
    setIsAgreeing(true);
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
      loadEachEvaluated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to agree on evaluation");
    } finally {
      setIsAgreeing(false);
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
            My Evaluations
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">My Evaluations</Typography>
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
                      {u.data?.slice(0, 2).map((obj, i) => (
                        <Box key={i}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {obj.objective_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {obj.total_score.toFixed(2)} / {obj.objective_weight}
                          </Typography>
                        </Box>
                      ))}
                      {u.data?.length > 2 && (
                        <Typography variant="caption" color="primary">
                          +{u.data.length - 2} more
                        </Typography>
                      )}
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
                    <Tooltip title="View Printable Scorecard">
                      <IconButton
                        color="info"
                        size="small"
                        onClick={() => handleShowDetails(u)}
                      >
                        <PrintIcon fontSize="small" />
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
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                    text-rendering: optimizeLegibility !important;
                  }
                  body {
                    overflow: visible !important;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #root {
                    display: none !important;
                  }
                  .MuiModal-root {
                    position: static !important;
                    overflow: visible !important;
                  }
                  .MuiBackdrop-root {
                    display: none !important;
                  }
                  #print-modal, #print-modal * {
                    visibility: visible;
                  }
                  #print-modal {
                    position: static !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    max-height: none !important;
                    height: auto !important;
                    overflow: visible !important;
                    transform: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  @page {
                    size: A4;
                    margin: 10mm;
                  }
                  /* Compact layout for print */
                  #print-modal .MuiGrid-item {
                    padding-top: 8px !important;
                  }
                  #print-modal .MuiCardContent-root {
                    padding: 12px !important;
                  }
                  #print-modal .MuiCardContent-root:last-child {
                    padding-bottom: 12px !important;
                  }
                  #print-modal .MuiPaper-root {
                    padding: 8px !important;
                    margin-bottom: 8px !important;
                  }
                  #print-modal .MuiTableCell-root {
                    padding: 4px 8px !important;
                  }
                  #print-modal .MuiStack-root > * + * {
                    margin-top: 8px !important;
                  }
                  #print-modal .MuiTypography-subtitle2 {
                    margin-bottom: 4px !important;
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
              <Grid container spacing={3}>
                {/* Left Column: Info & Recommendations */}
                <Grid item xs={12} sm={5} md={5}>
                  <Stack spacing={2}>
                    {/* Status & Recommendations */}
                    <Paper variant="outlined" sx={{ borderRadius: 3, borderLeft: "4px solid", borderLeftColor: "primary.main", p: 1.5, bgcolor: "#f8fafc" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Performance Status
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", mt: 0.5 }}>
                            {selectedUser.total_score.toFixed(2)}%
                          </Typography>
                        </Box>
                        {getStatusChip(selectedUser.total_score)}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: "primary.main", textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Strategic Recommendations
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.4, color: "text.primary", fontWeight: 500, fontSize: "0.75rem" }}>
                        {getInformativeToDo(selectedUser)}
                      </Typography>
                    </Paper>

                    {/* Employee Info Card */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, pl: 1 }}>
                        Employee Profile
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Full Name</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.evaluated_full_name || "N/A"}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Position</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.position || "N/A"}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Email</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.evaluated || "N/A"}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Process</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.process || "N/A"}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Employee ID</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.employee_id || "N/A"}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Sub Process</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.subprocess || "N/A"}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Title</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.title || "N/A"}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem", borderBottom: "none" }}>Branch</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", borderBottom: "none" }}>{selectedUser.evaluated?.branch || "N/A"}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Column: Breakdown */}
                <Grid item xs={12} sm={7} md={7}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, pl: 1 }}>
                    Performance Breakdown by Objective
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                        <TableRow>
                          <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700 }}>OBJECTIVE / METRIC</TableCell>
                          <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700 }} align="right">VALUE</TableCell>
                          <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700 }} align="right">SCORE</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUser.data?.map((obj, i) => (
                          <React.Fragment key={i}>
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                              <TableCell colSpan={2} sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155" }}>
                                {obj.objective_name}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: "0.75rem", fontWeight: 800, color: "primary.main" }}>
                                {obj.total_score.toFixed(2)} / {obj.objective_weight}
                              </TableCell>
                            </TableRow>
                            {obj.metrics?.map((m, idx) => (
                              <TableRow key={idx} sx={{ "&:last-child td": { border: 0 } }}>
                                <TableCell sx={{ fontSize: "0.75rem", pl: 3 }}>• {m.metric_name}</TableCell>
                                <TableCell sx={{ fontSize: "0.75rem" }} align="right">{m.evaluation_value}</TableCell>
                                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }} align="right">{Number(m.score || 0).toFixed(2)} / {m.metric_weight || 0}</TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 6, pt: 4, borderTop: "2px dashed #cbd5e1", pageBreakInside: "avoid" }}>
              <Typography variant="h6" sx={{ textAlign: "center", mb: 4, fontWeight: 700, color: "text.primary" }}>
                Agreed Document
              </Typography>
              <Grid container justifyContent="space-between">
                <Grid item xs={5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                    SUPERVISOR: {selectedUser?.evaluated?.evaluator_full_name?.toUpperCase() || "____________________"}
                  </Typography>
                  <Box sx={{ mt: 8, borderBottom: "1px solid #000", width: "100%", mb: 1 }}></Box>
                  <Typography variant="caption" color="text.secondary">
                    Signature
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", textAlign: "right" }}>
                    EMPLOYEE: {selectedUser?.evaluated?.evaluated_full_name?.toUpperCase() || "____________________"}
                  </Typography>
                  <Box sx={{ mt: 8, borderBottom: "1px solid #000", width: "100%", mb: 1 }}></Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "right" }}>
                    Signature
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }} className="no-print">
              <Button variant="outlined" color="primary" onClick={() => window.print()}>
                Print
              </Button>

              {selectedUser?.evaluated?.status?.toLowerCase() !== 'agreed' && selectedUser?.evaluated?.evaluated === user.MailAdress && (
                <Button variant="contained" color="success" onClick={() => handleAgree(selectedUser)} disabled={isAgreeing}>
                  {isAgreeing ? "Agreeing..." : "Agree"}
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

export default UserObjectiveEvaluationsMy;
