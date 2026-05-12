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
  Divider,
} from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
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
  width: { xs: "95%", md: 800 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const PerformanceMetricByTitle = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchData = async () => {
    try {
      console.log("user", user);

      setLoading(true);
      const metricRes = await axios.get(
        `${baseUrl}/performances/bytitle/${user.title_id}/${user.branch_grade}`,
      );
      setMetrics(metricRes.data);
    } catch (err) {
      console.error("Full Error:", err);
      toast.error("Your Branch grade is not maintained or failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.title_id) fetchData();
  }, [user.title_id]);

  useEffect(() => {
    if (metrics.length > 0) {
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
  }, [metrics]);

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
            My Performance Metrics
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Metrics for your Title: {user.title}
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">OKR</Typography>
            <Typography color="text.primary">My Metrics</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Metric Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Objective</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Formula</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Target FY</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.metric_id} hover>
                  <TableCell>{m.metric_id}</TableCell>
                  <TableCell>{m.metric_name}</TableCell>
                  <TableCell>{m.objective_name}</TableCell>
                  <TableCell>{m.measurement_formula}</TableCell>
                  <TableCell>{m.metric_weight}%</TableCell>
                  <TableCell>{m.unit_of_measure}</TableCell>
                  <TableCell>{m.evaluation_frequency}</TableCell>
                  <TableCell>{m.target_fy}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Details">
                      <IconButton
                        color="info"
                        size="small"
                        onClick={() => {
                          setSelectedMetric(m);
                          setShowDetailsModal(true);
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showDetailsModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Metric Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedMetric && (
              <Grid container spacing={2}>
                {Object.entries(selectedMetric).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      {key.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {String(value || "-")}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Box>
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

export default PerformanceMetricByTitle;
