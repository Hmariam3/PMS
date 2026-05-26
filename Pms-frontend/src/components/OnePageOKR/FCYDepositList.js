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
  FormControlLabel,
  Checkbox,
  Autocomplete,
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
    is_shared: false,
    shared_with: "",
    shared_amount_1: 0,
    shared_amount_2: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await axios.get(`${baseUrl}/users/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("User search failed", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSharedAmount1Change = (val) => {
    const amt1 = Number(val) || 0;
    const total = Number(deposit.amount) || 0;
    const amt2 = total - amt1;
    setDeposit(prev => ({
      ...prev,
      shared_amount_1: amt1,
      shared_amount_2: amt2 >= 0 ? amt2 : 0
    }));
  };

  const handleSharedAmount2Change = (val) => {
    const amt2 = Number(val) || 0;
    const total = Number(deposit.amount) || 0;
    const amt1 = total - amt2;
    setDeposit(prev => ({
      ...prev,
      shared_amount_1: amt1 >= 0 ? amt1 : 0,
      shared_amount_2: amt2
    }));
  };

  const handleMainAmountChange = (val) => {
    const mainAmt = Number(val) || 0;
    const isShareAllowed = mainAmt > 0;
    setDeposit(prev => {
      const isShared = prev.is_shared && isShareAllowed;
      return {
        ...prev,
        amount: mainAmt,
        is_shared: isShared,
        shared_amount_1: isShared ? mainAmt : 0,
        shared_amount_2: 0,
      };
    });
  };

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
      is_shared: false,
      shared_with: "",
      shared_amount_1: 0,
      shared_amount_2: 0,
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowForm(true);
  };

  const handleClose = () => setShowForm(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (deposit.is_shared) {
      const numAmount = Number(deposit.amount) || 0;
      if (numAmount <= 0) {
        toast.error("Sharing is only allowed for amounts greater than 0");
        return;
      }
      const sumShares = (Number(deposit.shared_amount_1) || 0) + (Number(deposit.shared_amount_2) || 0);
      if (sumShares > numAmount) {
        toast.error("The sum of shared amounts cannot exceed the main amount");
        return;
      }
      if (!deposit.shared_with) {
        toast.error("Please select a user to share with");
        return;
      }
    }

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
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (d) => {
    setDeposit({
      ...d,
      is_shared: d.is_shared || false,
      shared_with: d.shared_with || "",
      shared_amount_1: d.shared_amount_1 || 0,
      shared_amount_2: d.shared_amount_2 || 0,
    });
    setSearchQuery("");
    setSearchResults([]);
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
                  <TextField fullWidth label="Amount" type="number" value={deposit.amount} onChange={(e) => handleMainAmountChange(e.target.value)} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Reference" value={deposit.reference} onChange={(e) => setDeposit({ ...deposit, reference: e.target.value })} size="small" />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(deposit.is_shared && deposit.amount > 0)}
                        disabled={Number(deposit.amount) <= 0 || Boolean(deposit.fcy_id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDeposit(prev => ({
                            ...prev,
                            is_shared: checked,
                            shared_amount_1: checked ? Number(prev.amount) : 0,
                            shared_amount_2: 0,
                            shared_with: "",
                          }));
                        }}
                      />
                    }
                    label="To be Shared"
                  />
                  {Number(deposit.amount) <= 0 && !deposit.fcy_id && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5 }}>
                      Sharing is only allowed for amounts greater than 0
                    </Typography>
                  )}
                  {Boolean(deposit.fcy_id) && deposit.is_shared && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5 }}>
                      This is a shared deposit entry. Edit its individual details here.
                    </Typography>
                  )}
                </Grid>

                {deposit.is_shared && Number(deposit.amount) > 0 && !deposit.fcy_id && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Logged User"
                        value={deposit.crm_name || deposit.user_name}
                        disabled
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: "150px" }}>
                      <TextField
                        fullWidth
                        label="Logged User Amount Share"
                        type="number"
                        value={deposit.shared_amount_1 || ""}
                        onChange={(e) => handleSharedAmount1Change(e.target.value)}
                        required
                        size="small"
                        inputProps={{ min: 0, max: deposit.amount }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ width: "300px" }}>
                      <Autocomplete
                        size="small"
                        options={searchResults}
                        loading={searchLoading}
                        isOptionEqualToValue={(option, value) => option.user_name === value?.user_name}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return `(${option.user_name})${option.full_name || ""}`;
                        }}
                        onInputChange={(event, newInputValue) => {
                          setSearchQuery(newInputValue);
                        }}
                        value={
                          searchResults.find(u => u.user_name === deposit.shared_with) ||
                          (deposit.shared_with ? { user_name: deposit.shared_with, full_name: "" } : null)
                        }
                        onChange={(event, newValue) => {
                          setDeposit(prev => ({
                            ...prev,
                            shared_with: newValue ? newValue.user_name : ""
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Share With (Type min 3 characters)"
                            required
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: "150px" }}>
                      <TextField
                        fullWidth
                        label="Shared User Amount Share"
                        type="number"
                        value={deposit.shared_amount_2 || ""}
                        onChange={(e) => handleSharedAmount2Change(e.target.value)}
                        required
                        size="small"
                        inputProps={{ min: 0, max: deposit.amount }}
                      />
                    </Grid>
                  </>
                )}
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
