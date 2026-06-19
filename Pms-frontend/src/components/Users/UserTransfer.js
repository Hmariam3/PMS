import React, { useState, useEffect, useContext } from "react";
import {
  Box, Typography, Paper, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Stack, Backdrop, CircularProgress, Divider, Breadcrumbs, Alert
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const UserTransfer = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  const [processes, setProcesses] = useState([]);
  const [subprocesses, setSubProcesses] = useState([]);
  const [teams, setTeams] = useState([]);

  const [formData, setFormData] = useState({
    process: "",
    subprocess: "",
    team: ""
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [procRes, subRes, branchRes] = await Promise.all([
          axios.get(`${baseUrl}/processes`),
          axios.get(`${baseUrl}/subProcess`),
          axios.get(`${baseUrl}/branches`)
        ]);
        setProcesses(procRes.data);
        setSubProcesses(subRes.data);
        setTeams(branchRes.data);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    };
    loadDropdownData();
  }, [baseUrl]);

  const handleSearch = async () => {
    if (!searchTerm) {
      toast.warning("Please enter a username to search");
      return;
    }
    try {
      setLoading(true);
      setFoundUser(null);
      const res = await axios.get(`${baseUrl}/users/getUserByuserName/${searchTerm}`);
      if (res.data) {
        setFoundUser(res.data);
        setFormData({
          process: res.data.process || "",
          subprocess: res.data.subprocess || "",
          team: res.data.team || ""
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("User not found or search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "process") {
      setFormData({ process: value, subprocess: "", team: "" });
    } else if (name === "subprocess") {
      setFormData({ ...formData, subprocess: value, team: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const filteredSubProcesses = subprocesses.filter(sp => sp.process_name === formData.process);
  const filteredbranch = teams.filter(br => br.sub_proccess === formData.subprocess);

  const handleTransfer = async () => {
    if (!foundUser) return;
    try {
      setLoading(true);
      await axios.put(`${baseUrl}/users/${foundUser.user_name}/transfer`, formData);
      toast.success("User branch and targets updated successfully");
      handleSearch(); // refresh
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user branch");
    } finally {
      setLoading(false);
    }
  };

  const handleClearMappings = async (type) => {
    if (!foundUser) return;
    if (!window.confirm(`Are you sure you want to clear ${type} mappings for ${foundUser.user_name}?`)) return;

    try {
      setLoading(true);
      const res = await axios.delete(`${baseUrl}/users/mappings/${foundUser.user_name}/${type}`);
      toast.success(`${type} mappings cleared successfully`);
      if (res.data && res.data.deletedCounts) {
        console.log(res.data.deletedCounts);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to clear ${type} mappings`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            User Transfer & Mapping Cleanup
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Users</Typography>
            <Typography color="text.primary">User Transfer</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Search User</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Username"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ width: 300 }}
          />
          <Button variant="contained" onClick={handleSearch} color="primary">Search</Button>
        </Stack>
      </Paper>

      {foundUser && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Clear Mappings</Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Use these buttons to permanently remove mapped accounts for <b>{foundUser.user_name}</b> from the old branch.
              </Alert>

              <Stack spacing={2}>
                <Button variant="outlined" color="error" onClick={() => handleClearMappings('local')}>
                  Clear Local Account Mappings
                </Button>
                <Button variant="outlined" color="error" onClick={() => handleClearMappings('fcy')}>
                  Clear FCY Account Mappings
                </Button>
                <Button variant="outlined" color="error" onClick={() => handleClearMappings('loan')}>
                  Clear Loan Account Mappings
                </Button>
                <Divider />
                <Button variant="contained" color="error" onClick={() => handleClearMappings('all')}>
                  Clear All Mappings
                </Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Update User Branch</Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Updating branch here will also update the user's Targets and Non-Deposit Targets.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Process</InputLabel>
                    <Select name="process" value={formData.process} label="Process" onChange={handleChange}>
                      <MenuItem value=""><em>Select Process</em></MenuItem>
                      {processes.map((p) => (
                        <MenuItem key={p.id} value={p.process_name}>{p.process_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" disabled={!formData.process}>
                    <InputLabel>Sub Process</InputLabel>
                    <Select name="subprocess" value={formData.subprocess} label="Sub Process" onChange={handleChange}>
                      <MenuItem value=""><em>Select Sub Process</em></MenuItem>
                      {filteredSubProcesses.map((sp) => (
                        <MenuItem key={sp.id} value={sp.sub_process_name}>{sp.sub_process_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" disabled={!formData.subprocess}>
                    <InputLabel>Team / Branch</InputLabel>
                    <Select name="team" value={formData.team} label="Team / Branch" onChange={handleChange}>
                      <MenuItem value=""><em>Select Team / Branch</em></MenuItem>
                      {filteredbranch.map((t) => (
                        <MenuItem key={t.id} value={t.branch_name}>{t.branch_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary" onClick={handleTransfer}>
                  Update User Branch & Targets
                </Button>
              </Box>
            </Paper>
          </Grid>

        </Grid>
      )}

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default UserTransfer;
