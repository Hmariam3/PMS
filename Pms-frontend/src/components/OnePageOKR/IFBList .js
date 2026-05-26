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
  width: { xs: "95%", md: 500 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const IFBList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [ifbList, setIfbList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  const [ifb, setIfb] = useState({
    loan_id: null,
    beginning_balance: "",
    current_balance: "",
    user_name: user.UserName,
    process: user.process,
    subprocess: user.subprocess,
    team: "IFB",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/ifb`);
      setIfbList(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load IFB data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (ifbList.length > 0) {
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
  }, [ifbList]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIfb({ ...ifb, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    let err = {};
    if (!ifb.beginning_balance) err.beginning_balance = "Required";
    if (!ifb.current_balance) err.current_balance = "Required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      if (ifb.loan_id) {
        await axios.put(`${baseUrl}/ifb/${ifb.loan_id}`, ifb);
        toast.success("IFB record updated");
      } else {
        await axios.post(`${baseUrl}/ifb`, ifb);
        toast.success("IFB record created");
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save IFB record");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setIfb(item);
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/ifb/${id}`);
      toast.success("IFB record deleted");
      fetchData();
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
            IFB Deposits
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">IFB</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setIfb({
              loan_id: null,
              beginning_balance: "",
              current_balance: "",
              user_name: user.UserName,
              process: user.process,
              subprocess: user.subprocess,
              team: "IFB",
            });
            setErrors({});
            setShowForm(true);
          }}
          Color="info"
        >
          Add Record
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Beginning Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Current Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ifbList.map((i) => (
                <TableRow key={i.loan_id} hover>
                  <TableCell>{i.loan_id}</TableCell>
                  <TableCell>{i.user_name}</TableCell>
                  <TableCell>{Number(i.beginning_balance).toLocaleString()}</TableCell>
                  <TableCell>{Number(i.current_balance).toLocaleString()}</TableCell>
                  <TableCell>{i.process}</TableCell>
                  <TableCell>{i.team}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(i)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(i.loan_id)}>
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
              {ifb.loan_id ? "Edit IFB Record" : "Add IFB Record"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Beginning Balance"
                  name="beginning_balance"
                  type="number"
                  value={ifb.beginning_balance}
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
                  value={ifb.current_balance}
                  onChange={handleChange}
                  error={!!errors.current_balance}
                  helperText={errors.current_balance}
                  required
                  size="small"
                />
              </Stack>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {ifb.loan_id ? "Update Record" : "Save Record"}
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

export default IFBList;
