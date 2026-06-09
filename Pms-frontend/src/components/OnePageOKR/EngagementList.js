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

const EngagementList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [engagement, setEngagement] = useState({
    engagment: "",
    purpose: "",
    engagement_type: "",
    status: "Pending",
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    crm_name: user?.FullName || "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchEngagements = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/engagement/getEngagementsByUser`, {
        user_id: user.UserName,
        position: user.position,
        process: user.process,
        subprocess: user.subprocess,
        team: user.team,
      });
      setEngagements(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load engagements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagements();
  }, []);

  useEffect(() => {
    if (engagements.length > 0) {
      const table = $(tableRef.current).DataTable({
        destroy: true,
        pageLength: 10,
        responsive: true,
      });
      return () => { table.destroy(); };
    }
  }, [engagements]);

  const handleShow = () => {
    setEngagement({
      engagment: "",
      purpose: "",
      engagement_type: "",
      status: "Pending",
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
      if (engagement.eng_id) {
        await axios.put(`${baseUrl}/engagement/${engagement.eng_id}`, engagement);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${baseUrl}/engagement`, engagement);
        toast.success("Created successfully");
      }
      fetchEngagements();
      handleClose();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e) => {
    setEngagement(e);
    setShowForm(true);
  };

  const handleApprove = async (e) => {
    try {
      if (e.user_name === user.UserName) {
        toast.error("You cannot approve your own Engagement");
        return;
      }
      setLoading(true);
      await axios.put(`${baseUrl}/engagement/${e.eng_id}/approve`, {
        approved_by: user.UserName,
      });
      toast.success("Engagement approved successfully");
      fetchEngagements();
    } catch (err) {
      toast.error("Engagement approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/engagement/${id}`);
      toast.success("Deleted successfully");
      fetchEngagements();
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>Engagements</Typography>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">Dashboard</Link>
            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">Engagement</Typography>
          </Breadcrumbs>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleShow} color="info">Add Engagement</Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Engagement</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>CRM</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {engagements.map((e) => (
                <TableRow key={e.eng_id} hover>
                  <TableCell>{e.eng_id}</TableCell>
                  <TableCell>{e.engagment}</TableCell>
                  <TableCell>{e.engagement_type}</TableCell>
                  <TableCell>{e.purpose}</TableCell>
                  <TableCell>
                    <Box sx={{
                      px: 1.5, py: 0.5, borderRadius: 1, display: "inline-block",
                      bgcolor: e.status === 'Approved' ? '#dcfce7' : e.status === 'Pending' ? '#fef9c3' : '#fee2e2',
                      color: e.status === 'Approved' ? '#166534' : e.status === 'Pending' ? '#854d0e' : '#991b1b',
                      fontSize: '0.75rem', fontWeight: 700
                    }}>
                      {e.status}
                    </Box>
                  </TableCell>
                  <TableCell>{e.crm_name}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {(user.position === "Director" && user.process === "Interest Free Banking") &&
                        e.user_name !== user.UserName &&
                        e.status !== "Approved" && (
                          <IconButton color="success" size="small" onClick={() => handleApprove(e)}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        )}
                      {e.user_name === user.UserName && e.status === "Pending" && (
                        <>
                          <IconButton color="primary" onClick={() => handleEdit(e)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton color="error" onClick={() => handleDelete(e.eng_id)}><DeleteIcon fontSize="small" /></IconButton>
                        </>
                      )}
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>{engagement.eng_id ? "Edit" : "Add"} Engagement</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Engagement Name/Client" value={engagement.engagment} onChange={(e) => setEngagement({ ...engagement, engagment: e.target.value })} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ width: 300 }}>
                  <TextField fullWidth label="Engagement Type" select value={engagement.engagement_type} onChange={(e) => setEngagement({ ...engagement, engagement_type: e.target.value })} required size="small">
                    <MenuItem value="Customer Engagement">Customer Engagement</MenuItem>
                    <MenuItem value="New Customer Onboarding">New Customer Onboarding</MenuItem>
                  </TextField>
                </Grid>
                {/* <Grid item xs={12} sm={6} >
                  <TextField fullWidth label="Status" select value={engagement.status} onChange={(e) => setEngagement({ ...engagement, status: e.target.value })} size="small">
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </TextField>
                </Grid> */}
                <Grid item xs={12} sx={{ width: 600 }}>
                  <TextField fullWidth label="Purpose" multiline rows={3} value={engagement.purpose} onChange={(e) => setEngagement({ ...engagement, purpose: e.target.value })} required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="CRM Name" value={engagement.crm_name} InputProps={{ readOnly: true }} size="small" />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">{engagement.eng_id ? "Update" : "Save"}</Button>
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

export default EngagementList;
