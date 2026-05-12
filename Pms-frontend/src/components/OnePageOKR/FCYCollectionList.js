import React, { useState, useContext, useEffect } from "react";
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

const FCYCollectionList = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [fcyList, setFcyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  const [fcy, setFcy] = useState({
    fcy_id: null,
    beginning_balance: "",
    current_balance: "",
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
  });

  const fetchFCY = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
    };

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/fcy/getFcyByUser`, requestData);
      setFcyList(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load FCY data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFCY();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFcy((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!fcy.beginning_balance) newErrors.beginning_balance = "Required";
    if (!fcy.current_balance) newErrors.current_balance = "Required";
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
      if (fcy.fcy_id) {
        await axios.put(`${baseUrl}/fcy/${fcy.fcy_id}`, fcy);
        toast.success("FCY record updated");
      } else {
        await axios.post(`${baseUrl}/fcy`, fcy);
        toast.success("FCY record created");
      }
      setShowForm(false);
      fetchFCY();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save FCY record");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFcy({
      fcy_id: item.fcy_id,
      beginning_balance: String(item.beginning_balance || ""),
      current_balance: String(item.current_balance || ""),
      user_name: item.user_name || user?.UserName || "",
      process: item.process || "",
      subprocess: item.subprocess || "",
      team: item.team || "",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/fcy/${id}`);
      toast.success("FCY record deleted");
      fetchFCY();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
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
            FCY Collections
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">FCY</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFcy({
              fcy_id: null,
              beginning_balance: "",
              current_balance: "",
              user_name: user?.UserName || "",
              process: user?.process || "",
              subprocess: user?.subprocess || "",
              team: user?.team || "",
            });
            setErrors({});
            setShowForm(true);
          }}
          Color="info"
        >
          Add FCY
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table hover>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Beginning Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Current Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fcyList.map((item) => (
                <TableRow key={item.fcy_id} hover>
                  <TableCell>{item.fcy_id}</TableCell>
                  <TableCell>{item.user_name}</TableCell>
                  <TableCell>{Number(item.beginning_balance).toLocaleString()}</TableCell>
                  <TableCell>{Number(item.current_balance).toLocaleString()}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(item.fcy_id)}>
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
              {fcy.fcy_id ? "Edit FCY Record" : "Add FCY Record"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Beginning Balance"
                  name="beginning_balance"
                  type="number"
                  value={fcy.beginning_balance}
                  onChange={handleChange}
                  error={!!errors.beginning_balance}
                  helperText={errors.beginning_balance}
                  required
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Current Balance"
                  name="current_balance"
                  type="number"
                  value={fcy.current_balance}
                  onChange={handleChange}
                  error={!!errors.current_balance}
                  helperText={errors.current_balance}
                  required
                  size="small"
                />
                <TextField
                  fullWidth
                  label="User"
                  value={user?.FullName || ""}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Stack>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {fcy.fcy_id ? "Update Record" : "Save Record"}
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

export default FCYCollectionList;