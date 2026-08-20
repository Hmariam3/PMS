import React, { useEffect, useState, useRef } from "react";
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
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@mui/material";
import {
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import $ from "jquery";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";

const AreaManagerMapping = () => {
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [areaManagers, setAreaManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [mappings, setMappings] = useState([]);
  
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedAreaManager, setSelectedAreaManager] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      const districtObj = districts.find(d => d.subprocess_id === selectedDistrict);
      if (districtObj) {
        fetchAreaManagers(districtObj.subprocess_name);
        fetchBranches(selectedDistrict);
      }
    } else {
      setAreaManagers([]);
      setBranches([]);
      setSelectedAreaManager("");
      setSelectedBranches([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedAreaManager) {
      fetchMappings(selectedAreaManager);
    } else {
      setMappings([]);
    }
  }, [selectedAreaManager]);



  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/area-manager-branch/districts`);
      setDistricts(res.data);
    } catch (err) {
      toast.error("Failed to fetch districts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaManagers = async (districtName) => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/area-manager-branch/area-managers/${encodeURIComponent(districtName)}`);
      setAreaManagers(res.data);
    } catch (err) {
      toast.error("Failed to fetch Area Managers");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (districtId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/area-manager-branch/branches/${districtId}`);
      setBranches(res.data);
    } catch (err) {
      toast.error("Failed to fetch Branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/area-manager-branch/mapping/${userId}`);
      setMappings(res.data);
    } catch (err) {
      toast.error("Failed to fetch mappings");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDistrict || !selectedAreaManager || selectedBranches.length === 0) {
      toast.warning("Please select District, Area Manager, and at least one Branch.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        district_id: selectedDistrict,
        area_manager_user_id: selectedAreaManager,
        branch_ids: selectedBranches
      };
      
      await axios.post(`${baseUrl}/area-manager-branch`, payload);
      toast.success("Branches successfully assigned");
      
      setSelectedBranches([]);
      fetchMappings(selectedAreaManager);
      fetchBranches(selectedDistrict); // Refresh branch list to exclude newly mapped ones
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/area-manager-branch/${id}`);
      toast.success("Assignment removed");
      fetchMappings(selectedAreaManager);
      if (selectedDistrict) {
        fetchBranches(selectedDistrict); // Refresh branches list to include removed one
      }
    } catch (err) {
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
            Area Manager Mapping
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">Area Manager Mapping</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>District</InputLabel>
              <Select
                value={selectedDistrict}
                label="District"
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districts.map((d) => (
                  <MenuItem key={d.subprocess_id} value={d.subprocess_id}>
                    {d.subprocess_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth disabled={!selectedDistrict || areaManagers.length === 0}>
              <InputLabel>Area Manager</InputLabel>
              <Select
                value={selectedAreaManager}
                label="Area Manager"
                onChange={(e) => setSelectedAreaManager(e.target.value)}
              >
                {areaManagers.map((am) => (
                  <MenuItem key={am.id} value={am.id}>
                    {am.full_name} ({am.user_name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedDistrict || branches.length === 0}>
              <InputLabel>Branches</InputLabel>
              <Select
                multiple
                value={selectedBranches}
                label="Branches"
                onChange={(e) => setSelectedBranches(e.target.value)}
                renderValue={(selected) => 
                  selected.map(val => branches.find(b => b.id === val)?.branch_name).join(', ')
                }
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    <Checkbox checked={selectedBranches.indexOf(b.id) > -1} />
                    <ListItemText primary={`${b.branch_name} (${b.branch_code})`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              color="info"
              sx={{ height: 56 }}
              onClick={handleAssign}
              disabled={!selectedDistrict || !selectedAreaManager || selectedBranches.length === 0}
            >
              Assign Branch
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {selectedAreaManager && (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ p: 2, backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Typography variant="h6" sx={{ color: "#334155" }}>
              Assigned Branches
            </Typography>
          </Box>
          <TableContainer sx={{ minWidth: 650, p: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Branch Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Branch Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.branch_name}</TableCell>
                    <TableCell>{m.branch_code}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove Assignment">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(m.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default AreaManagerMapping;
