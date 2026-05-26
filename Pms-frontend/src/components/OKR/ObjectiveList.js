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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  PostAdd as PostAddIcon,
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

const ObjectiveList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [showMetricForm, setShowMetricForm] = useState(false);

  const [objectiveForm, setObjectiveForm] = useState({
    objective_name: "",
    objective_weight: 0,
    pillar_id: "",
    title_id: "",
    created_by: "",
    updated_by: "",
    grade: "",
  });

  const [metricForm, setMetricForm] = useState({
    metric_name: "",
    measurement_formula: "",
    metric_weight: 0,
    unit_of_measure: "",
    evaluation_frequency: "",
    target_fy: 0,
    objective_id: "",
    evaluator_input: "",
    dividerormultplid: "",
    operation: "",
    created_by: "",
    updated_by: "",
    input_by: "",
    calculated_for: "",
    calculated_with: "",
  });

  const [pillars, setPillars] = useState([]);
  const [titles, setTitles] = useState([]);
  const [grades, setGrades] = useState([]);
  const [objectiveErrors, setObjectiveErrors] = useState({});
  const [metricErrors, setMetricErrors] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [objRes, pillarRes, titleRes, gradRes] = await Promise.all([
        axios.get(`${baseUrl}/objectives`),
        axios.get(`${baseUrl}/pillars`),
        axios.get(`${baseUrl}/titles`),
        axios.get(`${baseUrl}/branchgrade/branch-grades`),
      ]);
      setObjectives(objRes.data);
      setPillars(pillarRes.data);
      setTitles(titleRes.data);
      setGrades(gradRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (objectives.length > 0) {
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
  }, [objectives]);

  const handleObjectiveChange = (e) => {
    setObjectiveForm({ ...objectiveForm, [e.target.name]: e.target.value });
  };

  const handleMetricChange = (e) => {
    setMetricForm({ ...metricForm, [e.target.name]: e.target.value });
  };

  const validateObjective = () => {
    const err = {};
    if (!objectiveForm.objective_name) err.objective_name = "Objective name is required";
    if (!objectiveForm.pillar_id) err.pillar_id = "Pillar is required";
    if (!objectiveForm.title_id) err.title_id = "Title is required";
    const weight = Number(objectiveForm.objective_weight);
    if (!objectiveForm.objective_weight) err.objective_weight = "Weight is required";
    else if (weight < 0 || weight > 100) err.objective_weight = "Weight must be 0-100";
    setObjectiveErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateMetric = () => {
    const err = {};
    if (!metricForm.metric_name) err.metric_name = "Metric name is required";
    if (!metricForm.objective_id) err.objective_id = "Objective is required";
    const weight = Number(metricForm.metric_weight);
    if (!metricForm.metric_weight) err.metric_weight = "Weight is required";
    else if (weight < 0 || weight > 100) err.metric_weight = "Weight must be 0-100";
    setMetricErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleObjectiveSubmit = async (e) => {
    e.preventDefault();
    if (!validateObjective()) return;

    try {
      if (objectiveForm.objective_id) {
        objectiveForm.updated_by = user.FullName;
        await axios.put(`${baseUrl}/objectives/${objectiveForm.objective_id}`, objectiveForm);
        toast.success("Objective updated successfully");
      } else {
        objectiveForm.created_by = user.FullName;
        await axios.post(`${baseUrl}/objectives`, objectiveForm);
        toast.success("Objective added successfully");
      }
      setShowObjectiveForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.message || "Failed to save objective");
    }
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (!validateMetric()) return;

    try {
      if (metricForm.metric_id) {
        metricForm.updated_by = user.FullName;
        await axios.put(`${baseUrl}/performances/${metricForm.metric_id}`, metricForm, {
          headers: { "x-api-key": process.env.REACT_APP_API_KEY },
        });
        toast.success("Metric updated successfully");
      } else {
        metricForm.created_by = user.FullName;
        await axios.post(`${baseUrl}/performances`, metricForm, {
          headers: { "x-api-key": process.env.REACT_APP_API_KEY },
        });
        toast.success("Metric added successfully");
      }
      setShowMetricForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save metric");
    }
  };

  const handleEdit = (obj) => {

    setObjectiveForm({
      ...obj,
      pillar_id: obj.pillar_id?.toString() || "",
      title_id: obj.title_id?.toString() || "",
    });
    setShowObjectiveForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this objective?")) return;
    try {
      await axios.delete(`${baseUrl}/objectives/${id}`);
      toast.success("Objective deleted");
      fetchData();
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
            Objectives
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">Objectives</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setObjectiveForm({ objective_name: "", objective_weight: 0, pillar_id: "", title_id: "", grade: "" });
            setShowObjectiveForm(true);
          }}
          Color="info"
        >
          Add Objective
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Objective Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pillar</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {objectives.map((o) => (
                <TableRow key={o.objective_id} hover>
                  <TableCell>{o.objective_id}</TableCell>
                  <TableCell>{o.objective_name}</TableCell>
                  <TableCell>{o.pillar_name}</TableCell>
                  <TableCell>{o.title_name}</TableCell>
                  <TableCell>{o.objective_weight}%</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => {
                            setSelectedObjective(o);
                            setShowDetailsModal(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Metric">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => {
                            setMetricForm({
                              metric_name: "",
                              measurement_formula: "",
                              metric_weight: 0,
                              unit_of_measure: "",
                              evaluation_frequency: "",
                              target_fy: 0,
                              objective_id: o.objective_id,
                              evaluator_input: "",
                              dividerormultplid: "",
                              operation: "",
                              input_by: "",
                              calculated_for: "",
                              calculated_with: "",
                            });
                            setShowMetricForm(true);
                          }}
                        >
                          <PostAddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleEdit(o)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(o.objective_id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
              Objective Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedObjective && (
              <Grid container spacing={2}>
                {Object.entries(selectedObjective).map(([key, value]) => (
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

      {/* Objective Add/Edit Modal */}
      <Modal
        open={showObjectiveForm}
        onClose={() => setShowObjectiveForm(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showObjectiveForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {objectiveForm.objective_id ? "Edit Objective" : "Add Objective"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleObjectiveSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Objective Name" name="objective_name" value={objectiveForm.objective_name} onChange={handleObjectiveChange} error={!!objectiveErrors.objective_name} helperText={objectiveErrors.objective_name} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!objectiveErrors.pillar_id} size="small" sx={{ width: 300 }}>
                    <InputLabel>Pillar</InputLabel>
                    <Select name="pillar_id" value={objectiveForm.pillar_id} onChange={handleObjectiveChange} label="Pillar">
                      {pillars.map((p) => <MenuItem key={p.pillar_id} value={p.pillar_id}>{p.pillar_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!objectiveErrors.title_id} size="small" sx={{ width: 300 }}>
                    <InputLabel>Title</InputLabel>
                    <Select name="title_id" value={objectiveForm.title_id} onChange={handleObjectiveChange} label="Title">
                      {titles.map((t) => <MenuItem key={t.id} value={t.id}>{t.title_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ width: 300 }}>
                    <InputLabel>Branch Grade</InputLabel>
                    <Select name="grade" value={objectiveForm.grade} onChange={handleObjectiveChange} label="Branch Grade">
                      {grades.map((g) => <MenuItem key={g.id} value={g.grade}>{g.grade}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Objective Weight (%)" name="objective_weight" type="number" value={objectiveForm.objective_weight} onChange={handleObjectiveChange} error={!!objectiveErrors.objective_weight} helperText={objectiveErrors.objective_weight} required size="small" />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowObjectiveForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">Save Objective</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Metric Add/Edit Modal */}
      <Modal
        open={showMetricForm}
        onClose={() => setShowMetricForm(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showMetricForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {metricForm.metric_id ? "Edit Metric" : "Add Metric"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleMetricSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Metric Name" name="metric_name" value={metricForm.metric_name} onChange={handleMetricChange} error={!!metricErrors.metric_name} helperText={metricErrors.metric_name} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Objective</InputLabel>
                    <Select name="objective_id" value={metricForm.objective_id} onChange={handleMetricChange} label="Objective" disabled>
                      {objectives.map((o) => <MenuItem key={o.objective_id} value={o.objective_id}>{o.objective_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Measurement Formula" name="measurement_formula" value={metricForm.measurement_formula} onChange={handleMetricChange} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Evaluator Input" name="evaluator_input" value={metricForm.evaluator_input} onChange={handleMetricChange} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ width: 300 }}>
                    <InputLabel>Operation</InputLabel>
                    <Select name="operation" value={metricForm.operation} onChange={handleMetricChange} label="Operation">
                      <MenuItem value="+">+</MenuItem>
                      <MenuItem value="-">-</MenuItem>
                      <MenuItem value="*">*</MenuItem>
                      <MenuItem value="/">/</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ width: 300 }}>
                    <InputLabel>Divider / Multiplier</InputLabel>
                    <Select name="dividerormultplid" value={metricForm.dividerormultplid} onChange={handleMetricChange} label="Divider / Multiplier">
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Metric Weight (%)" name="metric_weight" type="number" value={metricForm.metric_weight} onChange={handleMetricChange} error={!!metricErrors.metric_weight} helperText={metricErrors.metric_weight} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Unit of Measure" name="unit_of_measure" value={metricForm.unit_of_measure} onChange={handleMetricChange} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required size="small" sx={{ width: 300 }}>
                    <InputLabel>Frequency</InputLabel>
                    <Select name="evaluation_frequency" value={metricForm.evaluation_frequency} onChange={handleMetricChange} label="Frequency">
                      <MenuItem value="Weekly">Weekly</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                      <MenuItem value="Quarterly">Quarterly</MenuItem>
                      <MenuItem value="Annually">Annually</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Target FY" name="target_fy" type="number" value={metricForm.target_fy} onChange={handleMetricChange} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required size="small" sx={{ width: 300 }}>
                    <InputLabel>Input By</InputLabel>
                    <Select name="input_by" value={metricForm.input_by} onChange={handleMetricChange} label="Input By">
                      <MenuItem value="System">System</MenuItem>
                      <MenuItem value="User">User</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required size="small" sx={{ width: 300 }}>
                    <InputLabel>Calculated For</InputLabel>
                    <Select name="calculated_for" value={metricForm.calculated_for} onChange={handleMetricChange} label="Calculated For">
                      <MenuItem value="Deposit">Deposit</MenuItem>
                      <MenuItem value="Fcy">Fcy</MenuItem>
                      <MenuItem value="Loan">Loan</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="Transaction">Unauthorize Transaction</MenuItem>
                      <MenuItem value="Account">Account</MenuItem>
                      <MenuItem value="EEU">EEU</MenuItem>
                      <MenuItem value="Cash Collection">Cash Collection</MenuItem>
                      <MenuItem value="Digital Transaction">Digital Transaction</MenuItem>
                      <MenuItem value="CRM Deposit">CRM Deposit</MenuItem>
                      <MenuItem value="Merchant Recruitment">Merchant Recruitment</MenuItem>
                      <MenuItem value="Merchant Transaction Volume">Merchant Transaction Volume</MenuItem>
                      <MenuItem value="Agent Recruitment">Agent Recruitment</MenuItem>
                      <MenuItem value="Agent Transaction Volume">Agent Transaction Volume</MenuItem>
                      <MenuItem value="Michu Unique Recruitment">Michu Unique Recruitment</MenuItem>
                      <MenuItem value="Coopay Ebirr Activation">Coopay Ebirr Activation</MenuItem>
                      <MenuItem value="ATM CRM Uptime Rate">ATM CRM Uptime Rate</MenuItem>
                      <MenuItem value="Customer Satisfaction">Customer Satisfaction</MenuItem>
                      <MenuItem value="Customer Engagement">Customer Engagement</MenuItem>
                      <MenuItem value="New Customer Onboarding">New Customer Onboarding</MenuItem>
                      <MenuItem value="Deposit Sustainability">Deposit Sustainability</MenuItem>
                      <MenuItem value="SPM">SPM</MenuItem>
                      <MenuItem value="Employee Performance">Employee Performance</MenuItem>
                      <MenuItem value="Gl">Gl</MenuItem>
                      <MenuItem value="Cash Book">Cash Book</MenuItem>
                      <MenuItem value="Cash Surprise Cheque">Cash Surprise Cheque</MenuItem>
                      <MenuItem value="Branch Compliance">Branch Compliance</MenuItem>
                      <MenuItem value="Audit Report">Audit Report</MenuItem>
                      <MenuItem value="Audit Quality">Audit Quality</MenuItem>
                      <MenuItem value="Transaction Audit">Transaction Audit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required size="small" sx={{ width: 300 }}>
                    <InputLabel>Calculated With</InputLabel>
                    <Select name="calculated_with" value={metricForm.calculated_with} onChange={handleMetricChange} label="Calculated With">
                      <MenuItem value=">100">&gt;100</MenuItem>
                      <MenuItem value="100">100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowMetricForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">Save Metric</Button>
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

export default ObjectiveList;
