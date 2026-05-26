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
  TextField,
  Divider,
  Chip,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
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
  width: { xs: "95%", md: 600 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const Feedbacks = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMember, setFeedbackMember] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedbackListModal, setShowFeedbackListModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [feedbackForm, setFeedbackForm] = useState({
    subject: "",
    message: "",
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/employees/myTeam/${user.MailAdress}`
      );
      setTeam(res.data);
    } catch (err) {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.MailAdress) fetchTeam();
  }, [user?.MailAdress]);

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

  const handleFeedbackChange = (e) => {
    setFeedbackForm({
      ...feedbackForm,
      [e.target.name]: e.target.value,
    });
  };

  const openFeedbackModal = (member) => {
    setFeedbackMember(member);
    setFeedbackForm({ subject: "", message: "" });
    setShowFeedbackModal(true);
  };

  const sendFeedback = async () => {
    if (!feedbackForm.subject || !feedbackForm.message) {
      toast.warning("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${baseUrl}/feedbacks`, {
        user_name: feedbackMember.outlook_address,
        position: feedbackMember.title,
        branch: feedbackMember.branch_name,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
        process: feedbackMember.process_name,
        subprocess: feedbackMember.sub_process_name,
        sender: feedbackMember.supervisor,
      });
      toast.success("Feedback sent successfully");
      setShowFeedbackModal(false);
    } catch (err) {
      toast.error("Failed to send feedback");
    } finally {
      setLoading(false);
    }
  };

  const replyFeedback = async (id, replyText) => {
    if (!replyText) return;
    try {
      setLoading(true);
      await axios.put(`${baseUrl}/feedbacks/reply/${id}`, {
        reply: replyText,
      });
      toast.success("Reply sent successfully");
      fetchFeedbacks(selectedMember);
    } catch (err) {
      toast.error("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async (member) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/feedbacks/getByUserFeedbacks/${member.outlook_address}`
      );
      setFeedbackList(res.data);
      setSelectedMember(member);
      setShowFeedbackListModal(true);
    } catch (err) {
      toast.error("Failed to load feedbacks");
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
            My Team Feedbacks
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">My Team</Typography>
            <Typography color="text.primary">Feedbacks</Typography>
          </Breadcrumbs>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            Supervisor: {user?.display_name || user?.FullName}
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
                  <TableCell>{member.display_name}</TableCell>
                  <TableCell>{member.title}</TableCell>
                  <TableCell>{member.branch_name}</TableCell>
                  <TableCell>{member.sub_process_name}</TableCell>
                  <TableCell>{member.process_name}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Send Feedback">
                        <Button
                          variant="contained"
                          size="small"
                          color="info"
                          startIcon={<ChatIcon fontSize="small" />}
                          onClick={() => openFeedbackModal(member)}
                        >
                          Feedback
                        </Button>
                      </Tooltip>
                      <Tooltip title="View Feedbacks">
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<ViewIcon fontSize="small" />}
                          onClick={() => fetchFeedbacks(member)}
                        >
                          View
                        </Button>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Send Feedback Modal */}
      <Modal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showFeedbackModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Send Feedback to {feedbackMember?.display_name}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={feedbackForm.subject}
                onChange={handleFeedbackChange}
                size="small"
              />
              <TextField
                fullWidth
                label="Message"
                name="message"
                multiline
                rows={4}
                value={feedbackForm.message}
                onChange={handleFeedbackChange}
              />
            </Stack>
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
              <Button variant="contained" color="info" onClick={sendFeedback}>
                Send Feedback
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* View Feedbacks Modal */}
      <Modal
        open={showFeedbackListModal}
        onClose={() => setShowFeedbackListModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showFeedbackListModal}>
          <Box sx={{ ...modalStyle, width: { xs: "95%", md: 800 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Feedbacks for {selectedMember?.display_name}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {feedbackList.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No feedbacks found for this team member.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {feedbackList.map((fb) => (
                  <Paper key={fb.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {fb.subject}
                      </Typography>
                      <Chip
                        label={fb.status || "Sent"}
                        size="small"
                        color={fb.status === "Replied" ? "success" : "info"}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 2, color: "#475569" }}>
                      {fb.message}
                    </Typography>

                    {fb.reply && (
                      <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1, borderLeft: "4px solid #1b3fcd", mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#1b3fcd", display: "block", mb: 0.5 }}>
                          REPLY:
                        </Typography>
                        <Typography variant="body2">
                          {fb.reply}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        label="Write a reply..."
                        id={`reply-${fb.id}`}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => replyFeedback(fb.id, document.getElementById(`reply-${fb.id}`).value)}
                      >
                        Send Reply
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setShowFeedbackListModal(false)}>Close</Button>
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

export default Feedbacks;
