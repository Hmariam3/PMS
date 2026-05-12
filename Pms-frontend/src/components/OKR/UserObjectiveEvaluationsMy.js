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

const UserObjectiveEvaluationsMy = () => {
  const { user } = useContext(AuthContext);

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const loadEachEvaluated = async () => {
    try {
      setLoading(true);
      const results = await Promise.all([
        (async () => {
          const res = await axios.post(`${baseUrl}/evaluations/getByEvaluatedUser`, {
            evaluated: user.MailAdress,
          });
          const evaluationsData = res.data || [];

          const enriched = evaluationsData.map((item) => {
            const score =
              (Number(item.evaluation_value) || 0) *
              ((Number(item.weight) || 0) / 100) *
              ((Number(item.metric_weight) || 0) / 100) *
              ((Number(item.objective_weight) || 0) / 100);
            return { ...item, score };
          });

          const grouped = enriched.reduce((acc, item) => {
            const key = item.objective_name || "UNKNOWN";
            if (!acc[key]) {
              acc[key] = {
                objective_name: key,
                objective_weight: Number(item.objective_weight || 100),
                total_score: 0,
                metrics: [],
              };
            }
            acc[key].metrics.push(item);
            acc[key].total_score += Number(item.score) || 0;
            return acc;
          }, {});

          Object.values(grouped).forEach((obj) => {
            obj.total_score = Math.min(obj.total_score, obj.objective_weight);
          });

          const total_score = Object.values(grouped).reduce(
            (sum, obj) => sum + (Number(obj.total_score) || 0),
            0,
          );

          return {
            evaluations: evaluationsData,
            evaluated: user,
            data: Object.values(grouped),
            total_score,
          };
        })(),
      ]);
      setEvaluations(results);
    } catch (err) {
      console.error(err);
      toast.error("Failed loading evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.FullName) {
      loadEachEvaluated();
    }
  }, [user]);

  const handleShowDetails = (userData) => {
    setSelectedUser(userData);
    setShowModal(true);
  };

  const getStatusChip = (score) => {
    if (score >= 80) return <Chip label="Excellent" color="success" size="small" />;
    if (score >= 50) return <Chip label="Good" color="warning" size="small" />;
    return <Chip label="Need Improvement" color="error" size="small" />;
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
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
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
                <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sub Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Objectives</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((u, index) => (
                <TableRow key={u.evaluations[0]?.employee_id || index} hover>
                  <TableCell>{u.evaluations[0]?.employee_id || "-"}</TableCell>
                  <TableCell>{u.evaluated?.process || "-"}</TableCell>
                  <TableCell>{u.evaluated?.subprocess || "-"}</TableCell>
                  <TableCell>{u.evaluated?.team || "-"}</TableCell>
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
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Evaluation Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {selectedUser && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    My Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      {[
                        { label: "ID", value: selectedUser.evaluated?.employee_id },
                        { label: "Process", value: selectedUser.evaluated?.process },
                        { label: "Sub Process", value: selectedUser.evaluated?.subprocess },
                        { label: "Branch", value: selectedUser.evaluated?.team },
                        { label: "Total Score", value: selectedUser.total_score.toFixed(2), bold: true },
                      ].map((item, idx) => (
                        <Box key={idx} sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">{item.label}:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: item.bold ? 700 : 500 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Objectives Breakdown
                  </Typography>
                  <Stack spacing={3}>
                    {selectedUser.data?.map((obj, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>
                            {obj.objective_name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {obj.total_score.toFixed(2)} / {obj.objective_weight}
                          </Typography>
                        </Stack>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Metric</TableCell>
                                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }} align="right">Value</TableCell>
                                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }} align="right">Score</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {obj.metrics?.map((m, idx) => (
                                <TableRow key={idx}>
                                  <TableCell sx={{ fontSize: "0.75rem" }}>{m.metric_name}</TableCell>
                                  <TableCell sx={{ fontSize: "0.75rem" }} align="right">{m.evaluation_value}</TableCell>
                                  <TableCell sx={{ fontSize: "0.75rem" }} align="right">{Number(m.score || 0).toFixed(2)}</TableCell>
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

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
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
