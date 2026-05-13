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
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
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
  width: { xs: "95%", md: 600 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const DistrictMappingList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [mappings, setMappings] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [mapping, setMapping] = useState({
    district_name: "",
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    crm_name: user?.FullName || "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch mappings
      const mappingsRes = await axios.post(`${baseUrl}/districtmapping/getDistrictMappingsByUser`, {
        user_id: user.UserName,
        position: user.position,
        process: user.process,
        subprocess: user.subprocess,
        team: user.team,
      });
      setMappings(mappingsRes.data);

      // Fetch districts for dropdown
      const districtsRes = await axios.get(`${baseUrl}/districtmapping/getDistricts`);
      setDistricts(districtsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (mappings.length > 0) {
      const table = $(tableRef.current).DataTable({
        destroy: true,
        pageLength: 10,
        responsive: true,
      });
      return () => { table.destroy(); };
    }
  }, [mappings]);

  const handleShow = () => {
    setMapping({
      district_name: "",
      user_name: user?.UserName || "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      crm_name: user?.FullName || "",
    });
    setShowForm(true);
  };

  const handleClose = () => setShowForm(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (mapping.map_id) {
        await axios.put(`${baseUrl}/districtmapping/${mapping.map_id}`, mapping);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${baseUrl}/districtmapping`, mapping);
        toast.success("Added successfully");
      }
      fetchData();
      handleClose();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setMapping(m);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/districtmapping/${id}`);
      toast.success("Deleted successfully");
      fetchData();
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>District Mappings</Typography>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">Dashboard</Link>
            <Typography color="text.primary">Admin</Typography>
            <Typography color="text.primary">District Mapping</Typography>
          </Breadcrumbs>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleShow} color="info">Add Mapping</Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>District Name</TableCell>
                <TableCell>User</TableCell>
                <TableCell>CRM Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.map_id} hover>
                  <TableCell>{m.map_id}</TableCell>
                  <TableCell>{m.district_name}</TableCell>
                  <TableCell>{m.user_name}</TableCell>
                  <TableCell>{m.crm_name}</TableCell>
                  <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton color="primary" onClick={() => handleEdit(m)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(m.map_id)}><DeleteIcon fontSize="small" /></IconButton>
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>{mapping.map_id ? "Edit" : "Add"} District Mapping</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Select District</InputLabel>

                    <Select
                      label="Select District"
                      value={mapping.district_name}
                      onChange={(e) =>
                        setMapping({ ...mapping, district_name: e.target.value })
                      }
                      sx={{ width: 300 }}
                    >
                      {districts.map((d, index) => (
                        <MenuItem
                          key={index}
                          value={d.DISTRICT_NAME}
                        >
                          {d.DISTRICT_NAME}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="User Name" value={mapping.user_name} InputProps={{ readOnly: true }} size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="CRM Name" value={mapping.crm_name} InputProps={{ readOnly: true }} size="small" />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">{mapping.map_id ? "Update" : "Save"}</Button>
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

export default DistrictMappingList;
