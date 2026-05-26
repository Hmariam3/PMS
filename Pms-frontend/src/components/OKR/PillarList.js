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
  width: { xs: "90%", sm: 500 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const PillarList = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [pillarForm, setPillarForm] = useState({
    pillar_name: "",
    created_by: "",
    updated_by: "",
  });
  const [errors, setErrors] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchPillars = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/pillars`, {
        headers: { "Content-Type": "application/json" },
      });
      setPillars(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch pillars");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPillars();
  }, []);

  useEffect(() => {
    if (pillars.length > 0) {
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
  }, [pillars]);

  const handleFormChange = (e) => {
    setPillarForm({ ...pillarForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!pillarForm.pillar_name) newErrors.pillar_name = "Pillar name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (pillarForm.pillar_id) {
        pillarForm.updated_by = user.FullName;
        await axios.put(`${baseUrl}/pillars/${pillarForm.pillar_id}`, pillarForm, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Pillar updated successfully");
      } else {
        pillarForm.created_by = user.FullName;
        await axios.post(`${baseUrl}/pillars`, pillarForm, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Pillar added successfully");
      }
      setShowForm(false);
      fetchPillars();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save pillar");
    }
  };

  const handleEdit = (p) => {
    setPillarForm(p);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pillar?")) return;
    try {
      await axios.delete(`${baseUrl}/pillars/${id}`);
      toast.success("Pillar deleted successfully");
      fetchPillars();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleShowDetails = (p) => {
    setSelectedPillar(p);
    setShowDetailsModal(true);
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
            Pillars
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">Pillars</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setPillarForm({ pillar_name: "", created_by: "", updated_by: "" });
            setShowForm(true);
          }}
          Color="info"
        >
          Add Pillar
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 650 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pillar Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Updated Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pillars.map((p) => (
                <TableRow key={p.pillar_id} hover>
                  <TableCell>{p.pillar_id}</TableCell>
                  <TableCell>{p.pillar_name}</TableCell>
                  <TableCell>
                    {p.created_date ? new Date(p.created_date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {p.updated_date ? new Date(p.updated_date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handleShowDetails(p)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleEdit(p)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(p.pillar_id)}
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
              Pillar Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedPillar && (
              <Table size="small">
                <TableBody>
                  {Object.entries(selectedPillar).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell component="th" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{String(value || "-")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
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
              {pillarForm.pillar_id ? "Edit Pillar" : "Add Pillar"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Pillar Name"
                name="pillar_name"
                value={pillarForm.pillar_name}
                onChange={handleFormChange}
                error={!!errors.pillar_name}
                helperText={errors.pillar_name}
                margin="normal"
                variant="outlined"
              />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)} color="inherit">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" Color="info">
                  {pillarForm.pillar_id ? "Update" : "Add"}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default PillarList;
