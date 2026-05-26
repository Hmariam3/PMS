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
  Divider,
  Grid,
} from "@mui/material";
import {
  Assessment as EvaluateIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";
import { AuthContext } from "../../AuthContext";
import PerformanceMetricList from "./PerformanceMetricList";

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

const MyTeam = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();

  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMetricModal, setShowMetricModal] = useState(false);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/employees/myTeam/${user.MailAdress}`
      );
      setTeam(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.MailAdress) fetchTeam();
  }, [user.MailAdress]);

  useEffect(() => {
    if (team.length > 0) {
      const table = $(tableRef.current).DataTable({
        destroy: true,
        dom: "Bfrtip",
        buttons: ["excel", "pdf", "csv", "print"],
        pageLength: 50,
        responsive: true,
      });
      return () => {
        table.destroy();
      };
    }
  }, [team]);

  const handleEvaluate = (member) => {
    setSelectedMember(member);
    setShowMetricModal(true);
  };

  const handleShowDetails = (member) => {
    setSelectedMember(member);
    setShowModal(true);
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
            My Team Management
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">My Team</Typography>
            <Typography color="text.primary">Members</Typography>
          </Breadcrumbs>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            Supervisor: {user.display_name || user.FullName}
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>EID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sub Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.employee_id} hover>
                  <TableCell>{member.employee_id}</TableCell>
                  <TableCell sx={{ cursor: "pointer", color: "#1b3fcd", fontWeight: 500 }} onClick={() => handleShowDetails(member)}>
                    {member.display_name}
                  </TableCell>
                  <TableCell>{member.title}</TableCell>
                  <TableCell>{member.branch_name}</TableCell>
                  <TableCell>{member.sub_process_name}</TableCell>
                  <TableCell>{member.process_name}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="contained"
                        size="small"
                        color="info"
                        startIcon={<EvaluateIcon fontSize="small" />}
                        onClick={() => handleEvaluate(member)}
                      >
                        Evaluate
                      </Button>
                      {/* <Tooltip title="Remove (Mock)">
                        <IconButton color="error" size="small" onClick={() => toast.info("Delete action requested")}>
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

      {/* DETAILS MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Team Member Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {selectedMember && (
              <Grid container spacing={3}>
                {Object.entries(selectedMember).map(([k, v]) => (
                  <Grid item xs={12} sm={6} key={k}>
                    <Box sx={{ mb: 1, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "textSecondary", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {k.replace(/_/g, " ")}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: "#334155" }}>
                        {v || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={() => setShowModal(false)}>Close</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* METRICS EVALUATION MODAL */}
      <Modal
        open={showMetricModal}
        onClose={() => setShowMetricModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showMetricModal}>
          <Box sx={{ ...modalStyle, width: { xs: "98%", md: "90%" } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Performance Evaluation: {selectedMember?.display_name}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <PerformanceMetricList member={selectedMember} />
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outlined" color="info" onClick={() => setShowMetricModal(false)}>Close</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default MyTeam;
