import React, { useEffect, useState, useRef, useContext } from "react";
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
  TextField,
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link,
  Grid,
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";
import { AuthContext } from "../../AuthContext";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: 800 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const EvaluationList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [evaluationForm, setEvaluationForm] = useState({
    evaluation_id: null,
    metric_id: "",
    evaluator: "",
    evaluation_value: "",
    weight: "",
    evaluation_date: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchEvaluations = async () => {
    const requestData = {
      user_id: user.MailAdress,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
      team: user.team || null,
      cbsusername: user.cbsusername || null,
    };

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/evaluations`, requestData);
      setEvaluations(res.data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  useEffect(() => {
    if (evaluations.length > 0) {
      const table = $(tableRef.current).DataTable({
        destroy: true,
        dom: "Bfrtip",
        buttons: ["excel", "pdf", "csv", "print"],
        pageLength: 10,
        responsive: true,
      });
      return () => {
        table.destroy();
      };
    }
  }, [evaluations]);

  const handleChange = (e) => {
    setEvaluationForm({ ...evaluationForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const err = {};
    if (!evaluationForm.metric_id) err.metric_id = "Metric ID is required";
    if (!evaluationForm.evaluator) err.evaluator = "Evaluator is required";
    if (evaluationForm.evaluation_value === "" || isNaN(evaluationForm.evaluation_value))
      err.evaluation_value = "Evaluation value must be a number";
    if (evaluationForm.weight === "" || isNaN(evaluationForm.weight))
      err.weight = "Weight must be a number";
    if (!evaluationForm.evaluation_date) err.evaluation_date = "Date is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (evaluationForm.evaluation_id) {
        await axios.put(`${baseUrl}/evaluations/${evaluationForm.evaluation_id}`, evaluationForm);
        toast.success("Evaluation updated successfully");
      } else {
        await axios.post(`${baseUrl}/evaluations`, evaluationForm);
        toast.success("Evaluation added successfully");
      }
      setShowForm(false);
      fetchEvaluations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save evaluation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this evaluation?")) return;
    try {
      await axios.delete(`${baseUrl}/evaluations/${id}`);
      toast.success("Evaluation deleted");
      fetchEvaluations();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
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
            Evaluations
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="inherit">
              Dashboard
            </Typography>
            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">Evaluations</Typography>
          </Breadcrumbs>
        </Box>
        {/* <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEvaluationForm({
              evaluation_id: null,
              metric_id: "",
              evaluator: "",
              evaluation_value: "",
              weight: "",
              evaluation_date: "",
            });
            setShowForm(true);
          }}
          Color="info"
        >
          Add Evaluation
        </Button> */}
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Evaluated Person</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((e) => (
                <TableRow key={e.evaluation_id} hover>
                  <TableCell>{e.evaluation_id}</TableCell>
                  <TableCell>{e.metric_name}</TableCell>
                  <TableCell>{e.metric_weight}</TableCell>
                  <TableCell>
                    {e.metric_name === "Branch Vital"
                      ? Number(e.weight || 0)
                      : (Number(e.weight || 0) * 100) / 5}
                  </TableCell>
                  <TableCell>{e.evaluated}</TableCell>
                  <TableCell>{e.evaluation_value}</TableCell>

                  <TableCell>{new Date(e.evaluation_date).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => {
                            setSelectedEvaluation(e);
                            setShowDetailsModal(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(e.status !== "agreed") && (
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(e.evaluation_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showDetailsModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Evaluation Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedEvaluation && (
              <Grid container spacing={2}>
                {Object.entries(selectedEvaluation).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      {key.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {String(value || "-")}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {evaluationForm.evaluation_id ? "Edit Evaluation" : "Add Evaluation"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Metric ID" name="metric_id" value={evaluationForm.metric_id} onChange={handleChange} error={!!errors.metric_id} helperText={errors.metric_id} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Evaluator" name="evaluator" value={evaluationForm.evaluator} onChange={handleChange} error={!!errors.evaluator} helperText={errors.evaluator} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Evaluation Value" name="evaluation_value" type="number" value={evaluationForm.evaluation_value} onChange={handleChange} error={!!errors.evaluation_value} helperText={errors.evaluation_value} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Weight" name="weight" type="number" value={evaluationForm.weight} onChange={handleChange} error={!!errors.weight} helperText={errors.weight} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Evaluation Date" name="evaluation_date" type="date" value={evaluationForm.evaluation_date} onChange={handleChange} error={!!errors.evaluation_date} helperText={errors.evaluation_date} InputLabelProps={{ shrink: true }} required />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">Save Evaluation</Button>
              </Box>
            </form>
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

export default EvaluationList;
