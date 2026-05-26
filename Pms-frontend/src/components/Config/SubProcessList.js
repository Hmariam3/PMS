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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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

const SubProcessList = () => {
  const tableRef = useRef();
  const [subProcesses, setSubProcesses] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubProcess, setSelectedSubProcess] = useState(null);
  const [errors, setErrors] = useState({});
  const [subProcessForm, setSubProcessForm] = useState({
    sub_process_name: "",
    process_id: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleFormChange = (e) => {
    setSubProcessForm({ ...subProcessForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!subProcessForm.sub_process_name)
      newErrors.sub_process_name = "Sub-process name is required";
    if (!subProcessForm.process_id)
      newErrors.process_id = "Parent process is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchProcesses = async () => {
    try {
      const res = await axios.get(`${baseUrl}/processes`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      setProcesses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubProcesses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/subProcess`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      setSubProcesses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch sub-processes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    fetchSubProcesses();
  }, []);

  useEffect(() => {
    if (subProcesses.length > 0) {
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
  }, [subProcesses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (subProcessForm.id) {
        await axios.put(`${baseUrl}/subProcess/${subProcessForm.id}`, subProcessForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Sub-process updated");
      } else {
        await axios.post(`${baseUrl}/subProcess/createSubProcess`, subProcessForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Sub-process added");
      }
      setShowForm(false);
      fetchSubProcesses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }
  };

  const handleEdit = (sp) => {
    setSubProcessForm({
      ...sp,
      process_id: sp.process_id ? String(sp.process_id) : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-process?"))
      return;
    try {
      await axios.delete(`${baseUrl}/subProcess/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      toast.success("Sub-process deleted");
      fetchSubProcesses();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleShowDetails = (sp) => {
    setSelectedSubProcess(sp);
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
            Sub-Processes
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">Sub-Processes</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSubProcessForm({ sub_process_name: "", process_id: "" });
            setShowForm(true);
          }}
          Color="info"
        >
          Add Sub-Process
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 650 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sub-Process Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Updated Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subProcesses.map((sp) => (
                <TableRow key={sp.id} hover>
                  <TableCell>{sp.id}</TableCell>
                  <TableCell>{sp.sub_process_name}</TableCell>
                  <TableCell>{sp.process_name}</TableCell>
                  <TableCell>
                    {sp.created_date
                      ? new Date(sp.created_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {sp.updated_date
                      ? new Date(sp.updated_date).toLocaleDateString()
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
                          onClick={() => handleShowDetails(sp)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleEdit(sp)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(sp.id)}
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
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Sub-Process Details
            </Typography>
            {selectedSubProcess && (
              <Table size="small">
                <TableBody>
                  {Object.entries(selectedSubProcess).map(([key, value]) => (
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
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {subProcessForm.id ? "Edit Sub-Process" : "Add Sub-Process"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Sub-Process Name"
                name="sub_process_name"
                value={subProcessForm.sub_process_name}
                onChange={handleFormChange}
                error={!!errors.sub_process_name}
                helperText={errors.sub_process_name}
                margin="normal"
                variant="outlined"
              />
              <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.process_id}>
                <InputLabel id="process-label">Parent Process</InputLabel>
                <Select
                  labelId="process-label"
                  name="process_id"
                  value={subProcessForm.process_id}
                  onChange={handleFormChange}
                  label="Parent Process"
                >
                  <MenuItem value="">
                    <em>Select Process</em>
                  </MenuItem>
                  {processes.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>
                      {p.process_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.process_id && (
                  <Typography variant="caption" color="error">
                    {errors.process_id}
                  </Typography>
                )}
              </FormControl>
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)} color="inherit">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" Color="info">
                  {subProcessForm.id ? "Update" : "Add"}
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

export default SubProcessList;
