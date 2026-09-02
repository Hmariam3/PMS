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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { AuthContext } from "../../AuthContext";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: 900 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const QuarterOKRList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [keyResults, setKeyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    kr: "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    username: user?.UserName || "",
    month1: "",
    month2: "",
    month3: "",
    month4: "",
    month5: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleShow = () => {
    setForm({
      kr: "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      username: user?.UserName || "",
      month1: "",
      month2: "",
      month3: "",
      month4: "",
      month5: "",
    });
    setErrors({});
    setShowForm(true);
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/quarter-okr/user`, {
        username: user.UserName,
        team: user.team,
        process: user.process,
        subprocess: user.subprocess
      });
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch Quarter OKR records");
    } finally {
      setLoading(false);
    }
  };

  const fetchKeyResults = async () => {
    try {
      const res = await axios.post(`${baseUrl}/onepagekr/getOkrByUser/`, {
        user_id: user.UserName,
        position: user.position,
        process: user.process,
        subprocess: user.subprocess
      });
      setKeyResults(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch Key Results");
    }
  };

  useEffect(() => {
    if (user?.UserName) {
      fetchRecords();
      fetchKeyResults();
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
    if (!form.kr) {
      setErrors({ kr: "Required" });
      return;
    }

    try {
      setLoading(true);
      if (form.id) {
        await axios.put(`${baseUrl}/quarter-okr/${form.id}`, form);
        toast.success("Quarter OKR updated");
      } else {
        await axios.post(`${baseUrl}/quarter-okr`, form);
        toast.success("Quarter OKR added");
      }
      fetchRecords();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save Quarter OKR record");
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
      await axios.delete(`${baseUrl}/quarter-okr/${id}`);
      toast.success("Record deleted");
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
            Quarter OKR Monitoring
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">Quarter OKR</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleShow}
          color="info"
        >
          Add Quarter Record
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Key Result</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Month 1</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Month 2</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Month 3</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 500, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.kr}
                  </TableCell>
                  <TableCell>{r.month1}</TableCell>
                  <TableCell>{r.month2}</TableCell>
                  <TableCell>{r.month3}</TableCell>
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#125423" }}>
              Quarter OKR Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {selectedRecord && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    Linked Key Result
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    {selectedRecord.kr}
                  </Typography>
                </Grid>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Grid item xs={12} sm={4} md={2.4} key={num}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      Month {num}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155" }}>
                      {selectedRecord[`month${num}`] || "-"}
                    </Typography>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    Process / SubProcess
                  </Typography>
                  <Typography variant="body1">{selectedRecord.process} / {selectedRecord.subprocess}</Typography>
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
              {form.id ? "Edit Quarter Record" : "Add Quarter Record"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={{ width: 300 }} required error={!!errors.kr}>
                    <InputLabel>Key Result</InputLabel>
                    <Select
                      name="kr"
                      value={form.kr}
                      onChange={handleChange}
                      label="Key Result"
                    >
                      {keyResults.map((kr) => (
                        <MenuItem key={kr.kr_id} value={kr.kr_detail}>
                          {kr.kr_detail}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Grid item xs={12} sm={4} key={num}>
                    <TextField
                      fullWidth
                      label={`Month ${num} Target`}
                      name={`month${num}`}
                      value={form[`month${num}`]}
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

export default QuarterOKRList;
