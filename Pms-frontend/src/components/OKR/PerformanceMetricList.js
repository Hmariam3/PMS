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

const PerformanceMetricList = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [objectives, setObjectives] = useState([]);
  const [metricErrors, setMetricErrors] = useState({});
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

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      let metricRes = "";

      if (user.role === "Admin") {
        metricRes = await axios.get(`${baseUrl}/performances`);
      }
      const objectiveRes = await axios.get(`${baseUrl}/objectives`);
      setMetrics(metricRes.data);
      setObjectives(objectiveRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (metrics.length > 0) {
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
  }, [metrics]);

  const handleMetricChange = (e) => {
    setMetricForm({ ...metricForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const err = {};
    if (!metricForm.metric_name) err.metric_name = "Metric name is required";
    if (!metricForm.objective_id) err.objective_id = "Objective is required";
    const weight = Number(metricForm.metric_weight);
    if (!metricForm.metric_weight) err.metric_weight = "Weight is required";
    else if (weight < 0 || weight > 100) err.metric_weight = "Weight must be 0-100";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (metricForm.metric_id) {
        metricForm.updated_by = user.FullName;
        await axios.put(`${baseUrl}/performances/${metricForm.metric_id}`, metricForm, {
          headers: { "x-api-key": process.env.REACT_APP_API_KEY },
        });
        toast.success("Metric updated successfully");
      } else {
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

  const handleEdit = (m) => {
    setMetricForm({
      ...m,
      dividerormultplid: m.dividerormultplid || "",
    });
    setShowMetricForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this metric?")) return;
    try {
      await axios.delete(`${baseUrl}/performances/${id}`);
      toast.success("Metric deleted");
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
            Performance Metrics
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">Metrics</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Metric Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Objective</TableCell>
                <TableCell sx={{ fontWeight: 400 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Formula</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.metric_id} hover>
                  <TableCell>{m.metric_id}</TableCell>
                  <TableCell>{m.metric_name}</TableCell>
                  <TableCell>
                    {objectives.find((o) => o.objective_id === m.objective_id)?.objective_name || "-"}
                  </TableCell>
                  <TableCell>{m.title_name}</TableCell>
                  <TableCell>{m.measurement_formula}</TableCell>
                  <TableCell>{m.metric_weight}%</TableCell>
                  <TableCell>{m.evaluation_frequency}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => {
                            setSelectedMetric(m);
                            setShowDetailsModal(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {user.role === "Admin" && (
                        <Tooltip title="Edit">
                          <IconButton
                            color="warning"
                            size="small"
                            onClick={() => handleEdit(m)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user.role === "Admin" && (
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(m.metric_id)}
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
              Metric Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedMetric && (
              <Grid container spacing={2}>
                {Object.entries(selectedMetric).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      {key.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {key === "objective_id"
                        ? objectives.find((o) => o.objective_id === value)?.objective_name
                        : String(value || "-")}
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

      {/* Metric Edit Modal */}
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

export default PerformanceMetricList;
