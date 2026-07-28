import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Modal,
  TextField,
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  List,
  ListItem,
  ListItemText,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ProcessHierarchy = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [processes, setProcesses] = useState([]);
  const [subProcesses, setSubProcesses] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Selection State
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [selectedSubProcessId, setSelectedSubProcessId] = useState(null);

  // Modal States
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [showSubProcessForm, setShowSubProcessForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);

  // Form States
  const [processForm, setProcessForm] = useState({ process_name: "" });
  const [subProcessForm, setSubProcessForm] = useState({ sub_process_name: "", process_id: "" });
  const [branchForm, setBranchForm] = useState({ branch_name: "", branch_code: "", subprocess_id: "" });
  const [errors, setErrors] = useState({});

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: "",
    id: null,
    title: "",
    message: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  const apiKey = process.env.REACT_APP_API_KEY;

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = { "Content-Type": "application/json", "x-api-key": apiKey };
      const [procRes, subProcRes, branchRes] = await Promise.all([
        axios.get(`${baseUrl}/processes`, { headers }),
        axios.get(`${baseUrl}/subProcess`, { headers }),
        axios.get(`${baseUrl}/branches`, { headers }),
      ]);
      setProcesses(procRes.data);
      setSubProcesses(subProcRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load hierarchy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered lists based on selections
  const filteredSubProcesses = subProcesses.filter(sp => String(sp.process_id) === String(selectedProcessId));
  const filteredBranches = branches.filter(b => String(b.subprocess_id) === String(selectedSubProcessId));

  const handleProcessSelect = (id) => {
    setSelectedProcessId(id);
    setSelectedSubProcessId(null); // Reset sub-process selection
  };

  const handleSubProcessSelect = (id) => {
    setSelectedSubProcessId(id);
  };

  // Process CRUD
  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!processForm.process_name) return setErrors({ process_name: "Required" });
    try {
      const headers = { "Content-Type": "application/json", "x-api-key": apiKey };
      if (processForm.id) {
        await axios.put(`${baseUrl}/processes/${processForm.id}`, processForm, { headers });
        toast.success("Process updated");
      } else {
        await axios.post(`${baseUrl}/processes/createProcess`, processForm, { headers });
        toast.success("Process added");
      }
      setShowProcessForm(false);
      fetchAllData();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const initiateDeleteProcess = (p) => {
    const linkedSubProcesses = subProcesses.filter(sp => String(sp.process_id) === String(p.id));
    const linkedBranches = branches.filter(b => linkedSubProcesses.some(sp => String(b.subprocess_id) === String(sp.id)));
    
    setDeleteConfirm({
      open: true,
      type: 'process',
      id: p.id,
      title: 'Delete Process?',
      message: `Are you sure you want to delete "${p.process_name}"? This will also delete ${linkedSubProcesses.length} linked sub-processes and ${linkedBranches.length} linked branches. This action cannot be undone.`,
    });
  };

  const handleDeleteProcess = async (id) => {
    try {
      await axios.delete(`${baseUrl}/processes/${id}`, { headers: { "Content-Type": "application/json", "x-api-key": apiKey }});
      toast.success("Process deleted");
      if (selectedProcessId === id) setSelectedProcessId(null);
      fetchAllData();
    } catch (err) { toast.error("Delete failed"); }
    setDeleteConfirm({ ...deleteConfirm, open: false });
  };

  // SubProcess CRUD
  const handleSubProcessSubmit = async (e) => {
    e.preventDefault();
    if (!subProcessForm.sub_process_name) return setErrors({ sub_process_name: "Required" });
    try {
      const headers = { "Content-Type": "application/json", "x-api-key": apiKey };
      const payload = { ...subProcessForm, process_id: selectedProcessId };
      if (subProcessForm.id) {
        await axios.put(`${baseUrl}/subProcess/${subProcessForm.id}`, payload, { headers });
        toast.success("Sub-Process updated");
      } else {
        await axios.post(`${baseUrl}/subProcess/createSubProcess`, payload, { headers });
        toast.success("Sub-Process added");
      }
      setShowSubProcessForm(false);
      fetchAllData();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const initiateDeleteSubProcess = (sp) => {
    const linkedBranches = branches.filter(b => String(b.subprocess_id) === String(sp.id));
    
    setDeleteConfirm({
      open: true,
      type: 'subprocess',
      id: sp.id,
      title: 'Delete Sub-Process?',
      message: `Are you sure you want to delete "${sp.sub_process_name}"? This will also delete ${linkedBranches.length} linked branches. This action cannot be undone.`,
    });
  };

  const handleDeleteSubProcess = async (id) => {
    try {
      await axios.delete(`${baseUrl}/subProcess/${id}`, { headers: { "Content-Type": "application/json", "x-api-key": apiKey }});
      toast.success("Sub-Process deleted");
      if (selectedSubProcessId === id) setSelectedSubProcessId(null);
      fetchAllData();
    } catch (err) { toast.error("Delete failed"); }
    setDeleteConfirm({ ...deleteConfirm, open: false });
  };

  // Branch CRUD
  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    if (!branchForm.branch_name) return setErrors({ branch_name: "Required" });
    try {
      const headers = { "Content-Type": "application/json", "x-api-key": apiKey };
      const payload = { ...branchForm, subprocess_id: selectedSubProcessId };
      if (branchForm.id) {
        await axios.put(`${baseUrl}/branches/${branchForm.id}`, payload, { headers });
        toast.success("Branch updated");
      } else {
        await axios.post(`${baseUrl}/branches/createBranch`, payload, { headers });
        toast.success("Branch added");
      }
      setShowBranchForm(false);
      fetchAllData();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const initiateDeleteBranch = (b) => {
    setDeleteConfirm({
      open: true,
      type: 'branch',
      id: b.id,
      title: 'Delete Branch?',
      message: `Are you sure you want to delete "${b.branch_name}"? This action cannot be undone.`,
    });
  };

  const handleDeleteBranch = async (id) => {
    try {
      await axios.delete(`${baseUrl}/branches/${id}`, { headers: { "Content-Type": "application/json", "x-api-key": apiKey }});
      toast.success("Branch deleted");
      fetchAllData();
    } catch (err) { toast.error("Delete failed"); }
    setDeleteConfirm({ ...deleteConfirm, open: false });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'process') handleDeleteProcess(deleteConfirm.id);
    else if (deleteConfirm.type === 'subprocess') handleDeleteSubProcess(deleteConfirm.id);
    else if (deleteConfirm.type === 'branch') handleDeleteBranch(deleteConfirm.id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>Hierarchy Configuration</Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">Hierarchy</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Processes Column */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ height: '65vh', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
              <Typography variant="h6">Processes</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { setProcessForm({ process_name: "" }); setShowProcessForm(true); }}>Add</Button>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {processes.map(p => (
                <ListItem 
                  button 
                  key={p.id} 
                  selected={selectedProcessId === p.id}
                  onClick={() => handleProcessSelect(p.id)}
                  sx={{ borderBottom: '1px solid #f1f5f9' }}
                >
                  <ListItemText primary={p.process_name} secondary={`ID: ${p.id}`} />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); setProcessForm(p); setShowProcessForm(true); }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); initiateDeleteProcess(p); }}><DeleteIcon fontSize="small" /></IconButton>
                    <ChevronRightIcon color="action" />
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sub-Processes Column */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ height: '65vh', display: 'flex', flexDirection: 'column', borderRadius: 2, opacity: selectedProcessId ? 1 : 0.6 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
              <Typography variant="h6">Sub-Processes</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} disabled={!selectedProcessId} onClick={() => { setSubProcessForm({ sub_process_name: "" }); setShowSubProcessForm(true); }}>Add</Button>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {!selectedProcessId && (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Select a process to view sub-processes</Box>
              )}
              {selectedProcessId && filteredSubProcesses.map(sp => (
                <ListItem 
                  button 
                  key={sp.id} 
                  selected={selectedSubProcessId === sp.id}
                  onClick={() => handleSubProcessSelect(sp.id)}
                  sx={{ borderBottom: '1px solid #f1f5f9' }}
                >
                  <ListItemText primary={sp.sub_process_name} secondary={`ID: ${sp.id}`} />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); setSubProcessForm(sp); setShowSubProcessForm(true); }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); initiateDeleteSubProcess(sp); }}><DeleteIcon fontSize="small" /></IconButton>
                    <ChevronRightIcon color="action" />
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Branches Column */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ height: '65vh', display: 'flex', flexDirection: 'column', borderRadius: 2, opacity: selectedSubProcessId ? 1 : 0.6 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
              <Typography variant="h6">Branches</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} disabled={!selectedSubProcessId} onClick={() => { setBranchForm({ branch_name: "", branch_code: "" }); setShowBranchForm(true); }}>Add</Button>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {!selectedSubProcessId && (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Select a sub-process to view branches</Box>
              )}
              {selectedSubProcessId && filteredBranches.map(b => (
                <ListItem key={b.id} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                  <ListItemText primary={b.branch_name} secondary={`Code: ${b.branch_code || '-'} | ID: ${b.id}`} />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="warning" onClick={() => { setBranchForm(b); setShowBranchForm(true); }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => initiateDeleteBranch(b)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Modals for Process */}
      <Modal open={showProcessForm} onClose={() => setShowProcessForm(false)} BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={showProcessForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2 }}>{processForm.id ? "Edit Process" : "Add Process"}</Typography>
            <form onSubmit={handleProcessSubmit}>
              <TextField fullWidth label="Process Name" value={processForm.process_name} onChange={(e) => setProcessForm({ ...processForm, process_name: e.target.value })} error={!!errors.process_name} margin="normal" />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowProcessForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained">Save</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Modals for SubProcess */}
      <Modal open={showSubProcessForm} onClose={() => setShowSubProcessForm(false)} BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={showSubProcessForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2 }}>{subProcessForm.id ? "Edit Sub-Process" : "Add Sub-Process"}</Typography>
            <form onSubmit={handleSubProcessSubmit}>
              <TextField fullWidth label="Sub-Process Name" value={subProcessForm.sub_process_name} onChange={(e) => setSubProcessForm({ ...subProcessForm, sub_process_name: e.target.value })} error={!!errors.sub_process_name} margin="normal" />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowSubProcessForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained">Save</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Modals for Branch */}
      <Modal open={showBranchForm} onClose={() => setShowBranchForm(false)} BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={showBranchForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2 }}>{branchForm.id ? "Edit Branch" : "Add Branch"}</Typography>
            <form onSubmit={handleBranchSubmit}>
              <TextField fullWidth label="Branch Name" value={branchForm.branch_name} onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })} error={!!errors.branch_name} margin="normal" />
              <TextField fullWidth label="Branch Code" value={branchForm.branch_code} onChange={(e) => setBranchForm({ ...branchForm, branch_code: e.target.value })} margin="normal" />
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowBranchForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained">Save</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
      >
        <DialogTitle>{deleteConfirm.title}</DialogTitle>
        <DialogContent>
          <DialogContentText color="error">
            {deleteConfirm.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcessHierarchy;
