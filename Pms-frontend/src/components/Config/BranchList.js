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

const BranchList = () => {
  const tableRef = useRef();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ branch_name: "" });
  const [errors, setErrors] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleFormChange = (e) => {
    setBranchForm({ ...branchForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!branchForm.branch_name)
      newErrors.branch_name = "Branch name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/branches`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      setBranches(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
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
  }, [branches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (branchForm.id) {
        await axios.put(`${baseUrl}/branches/${branchForm.id}`, branchForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Branch updated successfully");
      } else {
        await axios.post(`${baseUrl}/branches/createBranch`, branchForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Branch added successfully");
      }
      setShowForm(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save branch");
    }
  };

  const handleEdit = (b) => {
    setBranchForm(b);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?"))
      return;
    try {
      await axios.delete(`${baseUrl}/branches/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      toast.success("Branch deleted");
      fetchBranches();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleShowDetails = (b) => {
    setSelectedBranch(b);
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
            Branches
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">Branches</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setBranchForm({ branch_name: "" });
            setShowForm(true);
          }}
          color="info"
        >
          Add Branch
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 650 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Updated At</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{b.branch_name}</TableCell>
                  <TableCell>
                    {b.created_at
                      ? new Date(b.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {b.updated_at
                      ? new Date(b.updated_at).toLocaleDateString()
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
                          onClick={() => handleShowDetails(b)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleEdit(b)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(b.id)}
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
              Branch Details
            </Typography>
            {selectedBranch && (
              <Table size="small">
                <TableBody>
                  {Object.entries(selectedBranch).map(([key, value]) => (
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
              {branchForm.id ? "Edit Branch" : "Add Branch"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Branch Name"
                name="branch_name"
                value={branchForm.branch_name}
                onChange={handleFormChange}
                error={!!errors.branch_name}
                helperText={errors.branch_name}
                margin="normal"
                variant="outlined"
              />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)} color="inherit">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" Color="info">
                  {branchForm.id ? "Update" : "Add"}
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

export default BranchList;
