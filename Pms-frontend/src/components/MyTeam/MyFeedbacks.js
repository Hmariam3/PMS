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

const MyFeedbacks = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMember, setFeedbackMember] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);

  const [feedbackForm, setFeedbackForm] = useState({
    subject: "",
    message: "",
  });

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/feedbacks/getByUserFeedbacks/${user.MailAdress}`
      );
      setFeedbackList(res.data);
    } catch (err) {
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.MailAdress) fetchFeedbacks();
  }, [user?.MailAdress]);

  useEffect(() => {
    if (feedbackList.length > 0) {
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
  }, [feedbackList]);

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
        user_name: user.MailAdress,
        position: user.title,
        branch: user.team,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
        process: user.process,
        subprocess: user.subprocess,
        sender: user.FullName,
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
      fetchFeedbacks();
    } catch (err) {
      toast.error("Failed to send reply");
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
            My Personal Feedbacks
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">My Account</Typography>
            <Typography color="text.primary">Feedbacks</Typography>
          </Breadcrumbs>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            User: {user?.display_name || user?.FullName}
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sub Process</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sender</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbackList.map((fb) => (
                <TableRow key={fb.id} hover>
                  <TableCell>{fb.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{fb.subject}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={fb.status || "Pending"}
                      size="small"
                      color={fb.status === "Replied" ? "success" : "info"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{fb.process}</TableCell>
                  <TableCell>{fb.subprocess}</TableCell>
                  <TableCell>{fb.sender}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<ChatIcon fontSize="small" />}
                        onClick={() => openFeedbackModal(fb)}
                      >
                        Details
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Feedback Details / Send Feedback Modal */}
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
              Feedback Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {feedbackMember && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={700}>{feedbackMember.subject}</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: "#475569", bgcolor: "#f1f5f9", p: 2, borderRadius: 1 }}>
                  {feedbackMember.message}
                </Typography>

                {feedbackMember.reply && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#ecfdf5", borderLeft: "4px solid #10b981", borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#047857", display: "block", mb: 0.5 }}>
                      REPLY:
                    </Typography>
                    <Typography variant="body2">{feedbackMember.reply}</Typography>
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Send New Reply / Feedback</Typography>
            <Stack spacing={2}>
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
              <Button onClick={() => setShowFeedbackModal(false)}>Close</Button>
              <Button variant="contained" color="success" onClick={sendFeedback}>
                Send
              </Button>
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

export default MyFeedbacks;
