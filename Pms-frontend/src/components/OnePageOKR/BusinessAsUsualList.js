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

const BusinessAsUsualList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    business_usual: "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    username: user?.UserName || "",
    resp1: "",
    resp2: "",
    resp3: "",
    resp4: "",
    resp5: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleShow = () => {
    setForm({
      business_usual: "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      username: user?.UserName || "",
      resp1: "",
      resp2: "",
      resp3: "",
      resp4: "",
      resp5: "",
    });
    setErrors({});
    setShowForm(true);
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/bau/user`, {
        username: user.UserName,
        team: user.team,
        process: user.process,
        subprocess: user.subprocess
      });
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch BAU records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.UserName) {
      fetchRecords();
    }
  }, [user]);

  useEffect(() => {
    if (records.length > 0) {
      const table = $(tableRef.current).DataTable({
        destroy: true,
        dom: "Bfrtip",
        buttons: ["excel", "pdf", "print"],
        pageLength: 10,
        responsive: true,
      });
      return () => {
        table.destroy();
      };
    }
  }, [records]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_usual) {
      setErrors({ business_usual: "Required" });
      return;
    }

    try {
      setLoading(true);
      if (form.id) {
        await axios.put(`${baseUrl}/bau/${form.id}`, form);
        toast.success("BAU record updated");
      } else {
        await axios.post(`${baseUrl}/bau`, form);
        toast.success("BAU record added");
      }
      fetchRecords();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save BAU record");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setForm(rec);
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/bau/${id}`);
      toast.success("BAU record deleted");
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete record");
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
            Business As Usual (BAU)
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">Operations</Typography>
            <Typography color="text.primary">BAU</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleShow}
          color="info"
        >
          Add BAU Record
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Main (Business Usual)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{r.business_usual}</TableCell>
                  <TableCell>{r.process}</TableCell>
                  <TableCell>{r.team}</TableCell>
                  <TableCell>{new Date(r.created_date).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => {
                            setSelectedRecord(r);
                            setShowDetailsModal(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(r.id)}>
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#1b3fcd" }}>
              BAU Record Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {selectedRecord && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    Main Business Usual
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    {selectedRecord.business_usual}
                  </Typography>
                </Grid>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Grid item xs={12} sm={6} key={num}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      Responsibility {num}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedRecord[`resp${num}`] || "-"}
                    </Typography>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    Process
                  </Typography>
                  <Typography variant="body1">{selectedRecord.process}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    Team
                  </Typography>
                  <Typography variant="body1">{selectedRecord.team}</Typography>
                </Grid>
              </Grid>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" color="info" onClick={() => setShowDetailsModal(false)}>
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {form.id ? "Edit BAU Record" : "Add BAU Record"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Main Business Usual"
                    name="business_usual"
                    value={form.business_usual}
                    onChange={handleChange}
                    error={!!errors.business_usual}
                    helperText={errors.business_usual}
                    required
                    size="small"
                  />
                </Grid>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Grid item xs={12} sm={6} key={num}>
                    <TextField
                      fullWidth
                      label={`Responsibility ${num}`}
                      name={`resp${num}`}
                      value={form[`resp${num}`]}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">
                  {form.id ? "Update Record" : "Add Record"}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default BusinessAsUsualList;
