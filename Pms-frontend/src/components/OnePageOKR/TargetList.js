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
  Check as CheckIcon,
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

const TargetList = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [target, setTarget] = useState({
    deposit_target: "",
    fcy_target: "",
    loan_collection: "",
    cash_collection: "",
    cash_deposited_crm: "",
    user_name: user?.UserName || "",
    process: user.process,
    subprocess: user.subprocess,
    team: user.team,
    status: "",
    created_by: user.UserName,
    approved_by: null,
  });

  const fetchTargets = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
      team: user.team,
    };
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/targets/getTargetByUser`, requestData);
      setTargets(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["deposit_target", "fcy_target", "loan_collection"].includes(name)) {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }
    setTarget({ ...target, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!target.deposit_target) newErrors.deposit_target = "Required";
    if (!target.fcy_target) newErrors.fcy_target = "Required";
    if (!target.loan_collection) newErrors.loan_collection = "Required";
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
      if (target.target_id) {
        await axios.put(`${baseUrl}/targets/${target.target_id}`, target);
        toast.success("Target updated successfully");
      } else {
        await axios.post(`${baseUrl}/targets`, {
          ...target,
          user_name: user?.UserName,
        });
        toast.success("Target added successfully");
      }
      setShowForm(false);
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save target");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
    setTarget({
      target_id: t.target_id,
      user_name: t.user_name || "",
      deposit_target: t.deposit_target || "",
      fcy_target: t.fcy_target || "",
      loan_collection: t.loan_collection || "",
      process: t.process || "",
      subprocess: t.subprocess || "",
      team: t.team || "",
      cash_collection: t.cash_collection || "",
      cash_deposited_crm: t.cash_deposited_crm || "",
      approved_by: t.approved_by || "",
      approved_at: t.approved_at || "",
      status: t.status || "",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleApprove = async (t) => {
    try {
      if (t.created_by === user.UserName) {
        toast.error("You cannot approve your own target");
        return;
      }
      setLoading(true);
      await axios.put(`${baseUrl}/targets/targetsapprove/${t.target_id}`, {
        approved_by: user.UserName,
        approved_at: new Date().toISOString(),
        status: "Approved",
      });
      toast.success("Target approved successfully");
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to approve target");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/targets/${id}`);
      toast.success("Target deleted");
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete target");
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
            Financial Targets
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Financial Targets</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setTarget({
              deposit_target: "",
              fcy_target: "",
              loan_collection: "",
              user_name: user?.UserName || "",
              process: user.process,
              subprocess: user.subprocess,
              team: user.team,
              cash_collection: "",
              cash_deposited_crm: "",
              status: "",
              created_by: user.UserName,
            });
            setErrors({});
            setShowForm(true);
          }}
          Color="info"
        >
          Add Target
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table hover>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Deposit Target</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>FCY Target</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loan Collection</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cash Collection</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cash Deposited in CRM</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((t) => (
                <TableRow key={t.target_id} hover>
                  <TableCell>{t.target_id}</TableCell>
                  <TableCell>{t.user_name}</TableCell>
                  <TableCell>{Number(t.deposit_target).toLocaleString()}</TableCell>
                  <TableCell>{Number(t.fcy_target).toLocaleString()}</TableCell>
                  <TableCell>{Number(t.loan_collection).toLocaleString()}</TableCell>
                  <TableCell>{Number(t.cash_collection).toLocaleString()}</TableCell>
                  <TableCell>{Number(t.cash_deposited_crm).toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "12px",
                        backgroundColor:
                          t.status === "Approved"
                            ? "green"
                            : t.status === "Pending"
                              ? "orange"
                              : t.status === "Rejected"
                                ? "red"
                                : "gray",
                      }}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">

                      {user.position === "Manager" && t.created_by !== user.UserName && t.status !== "Approved" && (
                        <Tooltip title="Approve">
                          <IconButton color="success" size="small" onClick={() => handleApprove(t)}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {t.created_by === user.UserName && t.status === "Pending" && (
                        <Tooltip title="Edit">
                          <IconButton color="primary" size="small" onClick={() => handleEdit(t)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>)
                      }
                      {t.created_by === user.UserName && t.status === "Pending" && (
                        <Tooltip title="Delete">
                          <IconButton color="error" size="small" onClick={() => handleDelete(t.target_id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>)
                      }
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
              {target.target_id ? "Edit Target" : "Add Target"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Deposit Target"
                  name="deposit_target"
                  value={target.deposit_target}
                  onChange={handleChange}
                  error={!!errors.deposit_target}
                  helperText={errors.deposit_target}
                  type="number"
                  required
                />
                <TextField
                  fullWidth
                  label="FCY Target"
                  name="fcy_target"
                  value={target.fcy_target}
                  onChange={handleChange}
                  error={!!errors.fcy_target}
                  helperText={errors.fcy_target}
                  type="number"
                  required
                />
                <TextField
                  fullWidth
                  label="Loan Collection"
                  name="loan_collection"
                  value={target.loan_collection}
                  onChange={handleChange}
                  error={!!errors.loan_collection}
                  helperText={errors.loan_collection}
                  type="number"
                  required
                />
                <TextField
                  fullWidth
                  label="Cash Collection"
                  name="cash_collection"
                  value={target.cash_collection}
                  onChange={handleChange}
                  error={!!errors.cash_collection}
                  helperText={errors.cash_collection}
                  type="number"
                  required
                />
                <TextField
                  fullWidth
                  label="Cash Deposited in CRM"
                  name="cash_deposited_crm"
                  value={target.cash_deposited_crm}
                  onChange={handleChange}
                  error={!!errors.cash_deposited_crm}
                  helperText={errors.cash_deposited_crm}
                  type="number"
                  required
                />
                <TextField
                  fullWidth
                  label="Assigned To"
                  value={user?.FullName || ""}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {target.target_id ? "Update Target" : "Add Target"}
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

export default TargetList;
