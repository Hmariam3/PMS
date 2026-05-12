import React, { useEffect, useState, useRef } from "react";
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

const style = {
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

const ProcessList = () => {
  const tableRef = useRef();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [processForm, setProcessForm] = useState({ process_name: "" });
  const [errors, setErrors] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleFormChange = (e) => {
    setProcessForm({ ...processForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!processForm.process_name)
      newErrors.process_name = "Process name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (processForm.id) {
        await axios.put(`${baseUrl}/processes/${processForm.id}`, processForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Process updated successfully");
      } else {
        await axios.post(`${baseUrl}/processes/createProcess`, processForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Process added successfully");
      }
      setShowForm(false);
      fetchProcesses();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/processes`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      setProcesses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch processes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (processes.length > 0) {
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
  }, [processes]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this process?"))
      return;
    try {
      await axios.delete(`${baseUrl}/processes/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      toast.success("Process deleted");
      fetchProcesses();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleEdit = (process) => {
    setProcessForm(process);
    setShowForm(true);
  };

  const handleShowDetails = (process) => {
    setSelectedProcess(process);
    setShowModal(true);
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
            Processes
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">Processes</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setProcessForm({ process_name: "" });
            setShowForm(true);
          }}
          Color="info"
        >
          Add Process
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 650 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Updated Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processes.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.process_name}</TableCell>
                  <TableCell>
                    {p.created_date
                      ? new Date(p.created_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {p.updated_date
                      ? new Date(p.updated_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                    >
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
                          onClick={() => handleDelete(p.id)}
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
        open={showModal}
        onClose={() => setShowModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showModal}>
          <Box sx={style}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Process Details
            </Typography>
            {selectedProcess && (
              <Table size="small">
                <TableBody>
                  {Object.entries(selectedProcess).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: 600, textTransform: "capitalize" }}
                      >
                        {key.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{String(value || "-")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setShowModal(false)}>Close</Button>
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
          <Box sx={style}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              {processForm.id ? "Edit Process" : "Add Process"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Process Name"
                name="process_name"
                value={processForm.process_name}
                onChange={handleFormChange}
                error={!!errors.process_name}
                helperText={errors.process_name}
                margin="normal"
                variant="outlined"
              />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)} color="inherit">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" Color="info">
                  {processForm.id ? "Update" : "Add"}
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

export default ProcessList;

