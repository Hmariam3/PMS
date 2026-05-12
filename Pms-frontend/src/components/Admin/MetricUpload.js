import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Breadcrumbs,
  Link,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  AutoFixHigh as AutoIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";

const MetricUpload = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/metric-upload/template`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "metric_upload_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download template");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event, endpoint) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userdata = JSON.parse(localStorage.getItem("user"));
    formData.append("created_by", userdata?.UserName || "system");

    try {
      setLoading(true);
      setResults(null);
      const res = await axios.post(`${baseUrl}/metric-upload/${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(res.data);
      if (res.data.errors?.length === 0) {
        toast.success(res.data.message);
      } else {
        toast.warning("Upload completed with some errors.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1e293b", mb: 1 }}>
          KPI & Metric Automation
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="/">Admin</Link>
          <Typography color="text.primary">Metric Upload</Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4, height: "100%" }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <DownloadIcon color="primary" /> Step 1: Download Template
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download the Excel template which contains a reference list of existing Objectives and their IDs.
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                sx={{ py: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Download Excel Template
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4, height: "100%" }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <AutoIcon color="secondary" /> Step 2: Automated Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a file to automatically create/link Strategic Pillars, Objectives, and Metrics in one go.
              </Typography>
              <Box component="form" onSubmit={(e) => handleUpload(e, "automate")}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ py: 1.5, borderRadius: 2, textTransform: "none" }}
                  >
                    Select File
                    <input type="file" name="file" accept=".xlsx,.xls" hidden required />
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    sx={{ py: 1.5, px: 4, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                  >
                    Upload & Automate
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {results && (
          <Grid item xs={12}>
            <Fade in={true}>
              <Paper elevation={2} sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Results</Typography>
                <Alert severity={results.errors?.length > 0 ? "warning" : "success"} sx={{ mb: 3 }}>
                  {results.message}
                </Alert>
                {results.errors?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="error" sx={{ mb: 1, fontWeight: 700 }}>Error Details:</Typography>
                    <List sx={{ bgcolor: "#fff1f2", borderRadius: 2 }}>
                      {results.errors.map((err, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon><ErrorIcon color="error" fontSize="small" /></ListItemIcon>
                          <ListItemText primary={err} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Paper>
            </Fade>
          </Grid>
        )}
      </Grid>

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

// Simple Grid helper since I didn't import it
const Grid = ({ children, container, spacing, item, xs, md, ...props }) => (
  <Box
    sx={{
      display: container ? "flex" : "block",
      flexWrap: container ? "wrap" : "nowrap",
      margin: container ? `-${(spacing || 0) * 4}px` : 0,
      width: item ? (md ? `${(md / 12) * 100}%` : (xs ? `${(xs / 12) * 100}%` : "100%")) : "auto",
      padding: item ? `${(spacing || 0) * 4}px` : 0,
      ...props.sx
    }}
  >
    {children}
  </Box>
);

const Fade = ({ children, in: inProp }) => (
  <Box sx={{ opacity: inProp ? 1 : 0, transition: "opacity 0.5s ease-in-out" }}>{children}</Box>
);

export default MetricUpload;
