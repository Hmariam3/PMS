import React, { useState, useEffect, useContext } from "react";
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
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: 500 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const PriorityList = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [priority, setPriority] = useState({
    priority_name: "",
    detail: "",
    user_name: user?.UserName || "",
    process: user.process,
    subprocess: user.subprocess,
    team: user.team,
  });

  const fetchPriorities = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
    };
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/priorities/getPriorityByUser`, requestData);
      setPriorities(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch priorities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPriority({ ...priority, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!priority.priority_name) newErrors.priority_name = "Required";
    if (!priority.detail) newErrors.detail = "Required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      if (priority.priority_id) {
        await axios.put(`${baseUrl}/priorities/${priority.priority_id}`, priority);
        toast.success("Priority updated");
      } else {
        await axios.post(`${baseUrl}/priorities`, {
          ...priority,
          user_name: user?.UserName,
        });
        toast.success("Priority added");
      }
      setShowForm(false);
      fetchPriorities();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save priority");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/priorities/${id}`);
      toast.success("Priority deleted");
      fetchPriorities();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete priority");
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
            Branch Priorities
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">Priorities</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setPriority({
              priority_name: "",
              detail: "",
              user_name: user?.UserName || "",
              process: user.process,
              subprocess: user.subprocess,
              team: user.team,
            });
            setErrors({});
            setShowForm(true);
          }}
          color="info"

        >
          Add Priority
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table hover>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Detail</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priorities.map((p) => (
                <TableRow key={p.priority_id} hover>
                  <TableCell>{p.priority_id}</TableCell>
                  <TableCell>{p.priority_name}</TableCell>
                  <TableCell>{p.detail}</TableCell>
                  <TableCell>{p.user_name}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(p.priority_id)}>
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
              {priority.priority_id ? "Edit Priority" : "Add Priority"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Priority Name"
                  name="priority_name"
                  value={priority.priority_name}
                  onChange={handleChange}
                  error={!!errors.priority_name}
                  helperText={errors.priority_name}
                  required
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Detail"
                  name="detail"
                  value={priority.detail}
                  onChange={handleChange}
                  error={!!errors.detail}
                  helperText={errors.detail}
                  multiline
                  rows={3}
                  required
                  size="small"
                />
                <TextField
                  fullWidth
                  label="User Name"
                  value={user?.FullName || ""}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Stack>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">

                  {priority.priority_id ? "Update Priority" : "Add Priority"}
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

export default PriorityList;
