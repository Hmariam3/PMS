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

const OnePageKRList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [krs, setKrs] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedKr, setSelectedKr] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [kr, setKr] = useState({
    objective_id: "",
    kr_detail: "",
    weight: 0,
    process: user.process,
    subprocess: user.subprocess,
    team: user.team,
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleShow = () => {
    setKr({
      objective_id: "",
      kr_detail: "",
      weight: 0,
      process: user.process,
      subprocess: user.subprocess,
      team: user.team,
    });
    setErrors({});
    setShowForm(true);
  };

  const fetchData = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
    };
    try {
      setLoading(true);
      const [objRes, krRes] = await Promise.all([
        axios.post(`${baseUrl}/onepageobjectives/by-user`, requestData),
        axios.post(`${baseUrl}/onepagekr/getOkrByUser`, requestData),
      ]);
      setObjectives(objRes.data);
      setKrs(krRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load OKR data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (krs.length > 0) {
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
  }, [krs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKr({ ...kr, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    if (!kr.kr_detail) validationErrors.kr_detail = "Required";
    if (!kr.weight) validationErrors.weight = "Required";
    if (!kr.objective_id) validationErrors.objective_id = "Required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      if (kr.kr_id) {
        await axios.put(`${baseUrl}/onepagekr/${kr.kr_id}`, {
          ...kr,
          updated_by: user.UserName,
        });
        toast.success("KR updated");
      } else {
        await axios.post(`${baseUrl}/onepagekr`, {
          ...kr,
          created_by: user.UserName,
          created_date: new Date().toISOString(),
        });
        toast.success("KR added");
      }
      fetchData();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save KR");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (krItem) => {
    setKr({
      kr_id: krItem.kr_id,
      objective_id: krItem.objective_id || "",
      kr_detail: krItem.kr_detail || "",
      weight: Number(krItem.weight) || 0,
      process: krItem.process || user.process,
      subprocess: krItem.subprocess || user.subprocess,
      team: krItem.team || user.team,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/onepagekr/${id}`);
      toast.success("KR deleted");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete KR");
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
            Key Results (KR)
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">KRs</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleShow}
          Color="info"
        >
          Add KR
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Objective</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>KR Detail</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {krs.map((k) => (
                <TableRow key={k.kr_id} hover>
                  <TableCell>{k.kr_id}</TableCell>
                  <TableCell>
                    {objectives.find((o) => o.objective_id === k.objective_id)?.objective_detail || "N/A"}
                  </TableCell>
                  <TableCell>{k.kr_detail}</TableCell>
                  <TableCell>{k.weight}%</TableCell>
                  <TableCell>{k.created_by}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => {
                            setSelectedKr(k);
                            setShowDetailsModal(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(k)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(k.kr_id)}>
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
              KR Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedKr && (
              <Grid container spacing={2}>
                {Object.entries(selectedKr).map(([key, value]) => (
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
              {kr.kr_id ? "Edit KR" : "Add KR"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <FormControl fullWidth size="small" error={!!errors.objective_id}>
                  <InputLabel>Objective</InputLabel>
                  <Select
                    name="objective_id"
                    value={kr.objective_id}
                    onChange={handleChange}
                    label="Objective"
                  >
                    {objectives.map((o) => (
                      <MenuItem key={o.objective_id} value={o.objective_id}>
                        {o.objective_detail}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.objective_id && <Typography variant="caption" color="error">{errors.objective_id}</Typography>}
                </FormControl>

                <TextField
                  fullWidth
                  label="KR Detail"
                  name="kr_detail"
                  value={kr.kr_detail}
                  onChange={handleChange}
                  error={!!errors.kr_detail}
                  helperText={errors.kr_detail}
                  multiline
                  rows={3}
                  size="small"
                />

                <TextField
                  fullWidth
                  label="Weight (%)"
                  name="weight"
                  type="number"
                  value={kr.weight}
                  onChange={handleChange}
                  error={!!errors.weight}
                  helperText={errors.weight}
                  size="small"
                />
              </Stack>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {kr.kr_id ? "Update KR" : "Add KR"}
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

export default OnePageKRList;
