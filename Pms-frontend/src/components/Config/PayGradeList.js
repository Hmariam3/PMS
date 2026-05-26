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

const PayGradeList = () => {
  const tableRef = useRef();
  const [payGrades, setPayGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayGrade, setSelectedPayGrade] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [payGradeForm, setPayGradeForm] = useState({
    pay_grade: "",
    pay_scale_level: "",
  });
  const [errors, setErrors] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleFormChange = (e) => {
    setPayGradeForm({ ...payGradeForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!payGradeForm.pay_grade) newErrors.pay_grade = "Pay grade is required";
    if (!payGradeForm.pay_scale_level)
      newErrors.pay_scale_level = "Pay scale level is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchPayGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/pay-grades`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      setPayGrades(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch pay grades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayGrades();
  }, []);

  useEffect(() => {
    if (payGrades.length > 0) {
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
  }, [payGrades]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (payGradeForm.id) {
        await axios.put(`${baseUrl}/pay-grades/${payGradeForm.id}`, payGradeForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Pay grade updated");
      } else {
        await axios.post(`${baseUrl}/pay-grades/createPayGrade`, payGradeForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Pay grade added");
      }
      setShowForm(false);
      fetchPayGrades();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }
  };

  const handleEdit = (pg) => {
    setPayGradeForm(pg);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pay grade?"))
      return;
    try {
      await axios.delete(`${baseUrl}/pay-grades/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      toast.success("Pay grade deleted");
      fetchPayGrades();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleShowDetails = (pg) => {
    setSelectedPayGrade(pg);
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
            Pay Grades
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">Pay Grades</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setPayGradeForm({ pay_grade: "", pay_scale_level: "" });
            setShowForm(true);
          }}
          Color="info"
        >
          Add Pay Grade
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 650 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pay Grade</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pay Scale Level</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payGrades.map((pg) => (
                <TableRow key={pg.id} hover>
                  <TableCell>{pg.id}</TableCell>
                  <TableCell>{pg.pay_grade}</TableCell>
                  <TableCell>{pg.pay_scale_level}</TableCell>
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
                          onClick={() => handleShowDetails(pg)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleEdit(pg)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(pg.id)}
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
              Pay Grade Details
            </Typography>
            {selectedPayGrade && (
              <Table size="small">
                <TableBody>
                  {Object.entries(selectedPayGrade).map(([key, value]) => (
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
              {payGradeForm.id ? "Edit Pay Grade" : "Add Pay Grade"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Pay Grade"
                name="pay_grade"
                value={payGradeForm.pay_grade}
                onChange={handleFormChange}
                error={!!errors.pay_grade}
                helperText={errors.pay_grade}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Pay Scale Level"
                name="pay_scale_level"
                value={payGradeForm.pay_scale_level}
                onChange={handleFormChange}
                error={!!errors.pay_scale_level}
                helperText={errors.pay_scale_level}
                margin="normal"
                variant="outlined"
              />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)} color="inherit">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" Color="info">
                  {payGradeForm.id ? "Update" : "Add"}
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

export default PayGradeList;
