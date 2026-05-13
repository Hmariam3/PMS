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
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
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
  width: { xs: "95%", md: 800 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const FCYDepositList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [deposit, setDeposit] = useState({
    account_number: "",
    account_holder: "",
    amount: 0,
    reference: "",
    status: "Pending",
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    crm_name: user?.FullName || "",
    createdby: user?.UserName || "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/fcy-deposit/getFcyDepositsByUser`, {
        user_id: user.UserName,
        position: user.position,
        process: user.process,
        subprocess: user.subprocess,
        team: user.team,
      });
      setDeposits(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load FCY deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  useEffect(() => {
    if (deposits.length > 0) {
      const table = $(tableRef.current).DataTable({
        destroy: true,
        pageLength: 10,
        responsive: true,
      });
      return () => { table.destroy(); };
    }
  }, [deposits]);

  const handleShow = () => {
    setDeposit({
      account_number: "",
      account_holder: "",
      amount: 0,
      reference: "",
      status: "Pending",
      user_name: user?.UserName || "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      crm_name: user?.FullName || "",
      createdby: user?.UserName || "",
    });
    setShowForm(true);
  };

  const handleClose = () => setShowForm(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (deposit.fcy_id) {
        await axios.put(`${baseUrl}/fcy-deposit/${deposit.fcy_id}`, deposit);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${baseUrl}/fcy-deposit`, deposit);
        toast.success("Created successfully");
      }
      fetchDeposits();
      handleClose();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (d) => {
    setDeposit(d);
    setShowForm(true);
  };

  const handleApprove = async (fcy) => {
    try {
      if (fcy.created_by === user.UserName) {
        toast.error("You cannot approve your own Fcy Deposit");
        return;
      }
      setLoading(true);
      await axios.put(`${baseUrl}/fcy-deposit/approve/${fcy.fcy_id}`, {
        approvedby: user.UserName,
        // approved_at: new Date().toISOString(),
        status: "Approved",
      });
      toast.success("Fcy Deposit approved successfully");
      fetchDeposits();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to approve Fcy Deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/fcy-deposit/${id}`);
      toast.success("Deleted successfully");
      fetchDeposits();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>FCY Deposits</Typography>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">Dashboard</Link>
            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">FCY Deposit</Typography>
          </Breadcrumbs>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleShow} color="info">Add Deposit</Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Holder</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>CRM</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deposits.map((d) => (
                <TableRow key={d.fcy_id} hover>
                  <TableCell>{d.fcy_id}</TableCell>
                  <TableCell>{d.account_number}</TableCell>
                  <TableCell>{d.account_holder}</TableCell>
                  <TableCell>{d.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{
                      px: 1.5, py: 0.5, borderRadius: 1, display: "inline-block",
                      bgcolor: d.status === 'Approved' ? '#dcfce7' : d.status === 'Pending' ? '#fef9c3' : '#fee2e2',
                      color: d.status === 'Approved' ? '#166534' : d.status === 'Pending' ? '#854d0e' : '#991b1b',
                      fontSize: '0.75rem', fontWeight: 700
                    }}>
                      {d.status}
                    </Box>
                  </TableCell>
                  <TableCell>{d.crm_name}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {user.position === "Manager" && d.created_by !== user.UserName && d.status !== "Approved" && (
                        <IconButton color="success" size="small" onClick={() => handleApprove(d)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton color="primary" onClick={() => handleEdit(d)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(d.fcy_id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Modal open={showForm} onClose={handleClose}>
        <Fade in={showForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>{deposit.fcy_id ? "Edit" : "Add"} FCY Deposit</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Account Number" value={deposit.account_number} onChange={(e) => setDeposit({ ...deposit, account_number: e.target.value })} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Account Holder" value={deposit.account_holder} onChange={(e) => setDeposit({ ...deposit, account_holder: e.target.value })} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Amount" type="number" value={deposit.amount} onChange={(e) => setDeposit({ ...deposit, amount: e.target.value })} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Reference" value={deposit.reference} onChange={(e) => setDeposit({ ...deposit, reference: e.target.value })} size="small" />
                </Grid>
                {/* <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Status" select value={deposit.status} onChange={(e) => setDeposit({...deposit, status: e.target.value})} size="small">
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </TextField>
                </Grid> */}
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="CRM Name" value={deposit.crm_name} InputProps={{ readOnly: true }} size="small" />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">{deposit.fcy_id ? "Update" : "Save"}</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      <Backdrop sx={{ color: "#fff", zIndex: 1400 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default FCYDepositList;
