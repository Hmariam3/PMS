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
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link,
  Grid,
  TextField,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
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
  width: { xs: "95%", md: 600 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const OnePageObjectiveList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [objective, setObjective] = useState({
    objective_detail: "",
    weight: 0,
    process: user.process,
    subprocess: user.subprocess,
    team: user.team,
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleShow = () => {
    setObjective({
      objective_detail: "",
      weight: 0,
      process: user.process,
      subprocess: user.subprocess,
      team: user.team,
    });
    setErrors({});
    setShowForm(true);
  };

  const fetchObjectives = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
    };
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/onepageobjectives/by-user`, requestData);
      setObjectives(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch objectives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setObjective({ ...objective, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    if (!objective.objective_detail) validationErrors.objective_detail = "Required";
    if (!objective.weight) validationErrors.weight = "Required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      if (objective.objective_id) {
        await axios.put(`${baseUrl}/onepageobjectives/${objective.objective_id}`, {
          ...objective,
          updated_by: user.UserName,
        });
        toast.success("Objective updated");
      } else {
        await axios.post(`${baseUrl}/onepageobjectives`, {
          ...objective,
          created_by: user.UserName,
          created_date: new Date().toISOString(),
        });
        toast.success("Objective added");
      }
      fetchObjectives();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save objective");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (obj) => {
    setObjective(obj);
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/onepageobjectives/${id}`);
      toast.success("Objective deleted");
      fetchObjectives();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete objective");
    } finally {
      setLoading(false);
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

            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">Objectives</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleShow}
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
                <TableCell sx={{ fontWeight: 600 }}>Detail</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {objectives.map((o) => (
                <TableRow key={o.objective_id} hover>
                  <TableCell>{o.objective_id}</TableCell>
                  <TableCell>{o.objective_detail}</TableCell>
                  <TableCell>{o.weight}%</TableCell>
                  <TableCell>{o.created_by}</TableCell>
                  <TableCell>{new Date(o.created_date).toLocaleDateString()}</TableCell>
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
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(o)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(o.objective_id)}>
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

      {/* Form Modal */}
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
              {objective.objective_id ? "Edit Objective" : "Add Objective"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Objective Detail"
                  name="objective_detail"
                  value={objective.objective_detail}
                  onChange={handleChange}
                  error={!!errors.objective_detail}
                  helperText={errors.objective_detail}
                  multiline
                  rows={3}
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  label="Weight (%)"
                  name="weight"
                  type="number"
                  value={objective.weight}
                  onChange={handleChange}
                  error={!!errors.weight}
                  helperText={errors.weight}
                  size="small"
                  required
                />
              </Stack>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {objective.objective_id ? "Update Objective" : "Add Objective"}
                </Button>
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

export default OnePageObjectiveList;
