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

const LoanCollectionList = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  const [loan, setLoan] = useState({
    loan_id: null,
    beginning_balance: "",
    current_balance: "",
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
  });

  const fetchLoans = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
    };

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/loan/getLoanByUser`, requestData);
      setLoans(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoan((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!loan.beginning_balance) newErrors.beginning_balance = "Required";
    if (!loan.current_balance) newErrors.current_balance = "Required";
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
      if (loan.loan_id) {
        await axios.put(`${baseUrl}/loan/${loan.loan_id}`, loan);
        toast.success("Loan updated successfully");
      } else {
        await axios.post(`${baseUrl}/loan`, loan);
        toast.success("Loan added successfully");
      }
      setShowForm(false);
      fetchLoans();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save loan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setLoan({
      loan_id: item.loan_id,
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
      await axios.delete(`${baseUrl}/loan/${id}`);
      toast.success("Loan deleted successfully");
      fetchLoans();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete loan");
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
            Loan Collections
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">Loan Collections</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setLoan({
              loan_id: null,
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
          Add Loan
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
              {loans.map((item) => (
                <TableRow key={item.loan_id} hover>
                  <TableCell>{item.loan_id}</TableCell>
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
                        <IconButton color="error" size="small" onClick={() => handleDelete(item.loan_id)}>
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
              {loan.loan_id ? "Edit Loan Record" : "Add Loan Record"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Beginning Balance"
                  name="beginning_balance"
                  type="number"
                  value={loan.beginning_balance}
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
                  value={loan.current_balance}
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
                  {loan.loan_id ? "Update Loan" : "Save Loan"}
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

export default LoanCollectionList;