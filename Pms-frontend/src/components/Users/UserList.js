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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
  width: { xs: "95%", md: 800 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const UserList = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    user_name: "",
    full_name: "",
    department: "",
    mail_address: "",
    process: "",
    subprocess: "",
    team: "",
    position: "",
    reportto: "",
    role: "maker",
    organization: "",
    created_by: user?.FullName || "",
  });

  const [processes, setProcesses] = useState([]);
  const [subprocesses, setSubProcesses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const loadDropdownData = async () => {
      try {
        const [procRes, subRes, branchRes] = await Promise.all([
          axios.get(`${baseUrl}/processes`),
          axios.get(`${baseUrl}/subProcess`),
          axios.get(`${baseUrl}/branches`),
        ]);
        setProcesses(procRes.data);
        setSubProcesses(subRes.data);
        setTeams(branchRes.data);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    };
    loadDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "process") {
      setFormData({
        ...formData,
        process: value,
        subprocess: "",
        team: "",
      });
    } else if (name === "subprocess") {
      setFormData({
        ...formData,
        subprocess: value,
        team: "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const filteredSubProcesses = subprocesses.filter(
    (sp) => sp.process_name === formData.process
  );

  const filteredbranch = teams.filter(
    (br) => br.sub_proccess === formData.subprocess
  );

  const validate = () => {
    const newErrors = {};
    if (!formData.user_name) newErrors.user_name = "Required";
    if (!formData.full_name) newErrors.full_name = "Required";
    if (!formData.mail_address) newErrors.mail_address = "Required";
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
      if (formData.id) {
        await axios.put(`${baseUrl}/users/${formData.id}`, formData);
        toast.success("User updated successfully");
      } else {
        formData.created_by = user?.FullName || "";
        await axios.post(`${baseUrl}/users/createUser`, formData);
        toast.success("User added successfully");
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u) => {
    setFormData({ ...u });
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.user_name?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term) ||
      u.mail_address?.toLowerCase().includes(term) ||
      u.department?.toLowerCase().includes(term) ||
      u.process?.toLowerCase().includes(term) ||
      u.organization?.toLowerCase().includes(term)
    );
  });

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
            User Management
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">Users</Typography>
            <Typography color="text.primary">User List</Typography>
          </Breadcrumbs>
        </Box>
        {/* <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormData({
              user_name: "",
              full_name: "",
              department: "",
              mail_address: "",
              process: "",
              subprocess: "",
              team: "",
              position: "",
              reportto: "",
              role: "maker",
              organization: "",
              created_by: user?.FullName || "",
            });
            setErrors({});
            setShowForm(true);
          }}
          Color="info"
        >
          Add User
        </Button> */}
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 300 } }}
          />
        </Box>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table hover>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.user_name}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.mail_address}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.process}</TableCell>
                  <TableCell>{u.organization}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(u.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip> */}
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
              {formData.id ? "Edit User Account" : "Create New User"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    error={!!errors.user_name}
                    helperText={errors.user_name}
                    required
                    size="small"
                    InputProps={{ readOnly: !!formData.id }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={!!errors.full_name}
                    helperText={errors.full_name}
                    required
                    size="small"
                    InputProps={{ readOnly: !!formData.id }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="mail_address"
                    type="email"
                    value={formData.mail_address}
                    onChange={handleChange}
                    error={!!errors.mail_address}
                    helperText={errors.mail_address}
                    required
                    size="small"
                    InputProps={{ readOnly: !!formData.id }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    size="small"
                    InputProps={{ readOnly: !!formData.id }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Process</InputLabel>
                    <Select
                      name="process"
                      value={formData.process || ""}
                      label="Process"
                      onChange={handleChange}
                    >
                      <MenuItem value=""><em>Select Process</em></MenuItem>
                      {processes.map((p) => (
                        <MenuItem key={p.id} value={p.process_name}>{p.process_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={!formData.process}>
                    <InputLabel>Sub Process</InputLabel>
                    <Select
                      name="subprocess"
                      value={formData.subprocess || ""}
                      label="Sub Process"
                      onChange={handleChange}
                    >
                      <MenuItem value=""><em>Select Sub Process</em></MenuItem>
                      {filteredSubProcesses.map((sp) => (
                        <MenuItem key={sp.id} value={sp.sub_process_name}>{sp.sub_process_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={!formData.subprocess}>
                    <InputLabel>Team / Branch</InputLabel>
                    <Select
                      name="team"
                      value={formData.team || ""}
                      label="Team / Branch"
                      onChange={handleChange}
                    >
                      <MenuItem value=""><em>Select Team / Branch</em></MenuItem>
                      {filteredbranch.map((t) => (
                        <MenuItem key={t.id} value={t.branch_name}>{t.branch_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Position</InputLabel>
                    <Select
                      name="position"
                      value={formData.position}
                      label="Position"
                      onChange={handleChange}
                    >
                      <MenuItem value="CEO">CEO</MenuItem>
                      <MenuItem value="CHF">CHF</MenuItem>
                      <MenuItem value="VP">VP</MenuItem>
                      <MenuItem value="Senior Director">Senior Director</MenuItem>
                      <MenuItem value="Director">Director</MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                      <MenuItem value="CRM">CRM</MenuItem>
                      <MenuItem value="Individual">Individual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Report To"
                    name="reportto"
                    value={formData.reportto}
                    onChange={handleChange}
                    size="small"
                    InputProps={{ readOnly: !!formData.id }}
                  />
                </Grid> */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      label="Role"
                      onChange={handleChange}
                    >
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="maker">Maker</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Organization</InputLabel>
                    <Select
                      name="organization"
                      value={formData.organization}
                      label="Organization"
                      onChange={handleChange}
                    >
                      <MenuItem value="Ho">Ho</MenuItem>
                      <MenuItem value="Do">Do</MenuItem>
                      <MenuItem value="Branch">Branch</MenuItem>

                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {formData.id ? "Update User" : "Create User"}
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

export default UserList;
