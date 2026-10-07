import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  Modal,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as AcceptIcon,
  Cancel as DeclineIcon,
  HowToReg as GuarantorIcon,
} from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";
import StaffLoanRequestForm from "./StaffLoanRequestForm";
import StaffLoanRequestDetail from "./StaffLoanRequestDetail";
import { generateLoanPdf } from "./generateLoanPdf";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: "90%", lg: 1200 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
  overflowY: "auto",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const loanTypeLabel = (type) => {
  if (type === "Personal Against Suretyship") return "Personal";
  if (type === "Housing/Mortgage") return "Housing";
  if (type === "Automobile") return "Automobile";
  if (type === "Emergency Loan") return "Emergency";
  return type || "-";
};

const STATUS_COLOR = {
  Pending: { color: "warning", variant: "outlined" },
  "Manager Review": { color: "info", variant: "outlined" },
  "Checker Review": { color: "info", variant: "outlined" },
  Recommended: { color: "success", variant: "filled" },
  "Not Recommended": { color: "error", variant: "filled" },
  Approved: { color: "success", variant: "filled" },
  Rejected: { color: "error", variant: "filled" },
};

const CONSENT_COLOR = {
  Pending: { color: "warning", label: "Awaiting Consent" },
  Accepted: { color: "success", label: "Accepted \u2713" },
  Declined: { color: "error", label: "Declined \u2717" },
};

const ROW_BORDER = {
  Recommended: "#2e7d32",
  "Not Recommended": "#c62828",
  Pending: "#ed6c02",
  "Manager Review": "#0288d1",
  "Checker Review": "#0288d1",
};

// shared DataGrid sx
const gridSx = {
  border: "none",
  "& .MuiDataGrid-columnHeaders": { backgroundColor: "primary.main", color: "#000", fontSize: "0.85rem" },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#000" },
  "& .MuiDataGrid-columnHeader .MuiIconButton-root": { color: "#000" },
  "& .MuiDataGrid-columnHeader .MuiSvgIcon-root": { color: "#000" },
  "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
  "& .row-recommended": { borderLeft: "4px solid #2e7d32" },
  "& .row-not-recommended": { borderLeft: "4px solid #c62828" },
  "& .row-pending": { borderLeft: "4px solid #ed6c02" },
  "& .row-review": { borderLeft: "4px solid #0288d1" },
  "& .MuiDataGrid-cell": { alignItems: "center" },
  "& .MuiDataGrid-footerContainer": { borderTop: "1px solid", borderColor: "divider" },
};

// ─── Custom toolbar ───────────────────────────────────────────────────────────
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1, gap: 1 }}>
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        csvOptions={{ fileName: "staff_loan_requests" }}
        printOptions={{ fileName: "staff_loan_requests" }}
      />
    </GridToolbarContainer>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const StaffLoanRequestList = () => {
  const { user } = useContext(AuthContext);

  const userTitle = user?.title || "";
  const userEmail = user?.MailAdress || user?.email || "";
  const userUsername = user?.UserName || user?.user_name || "";
  console.log("userUsername: ", userUsername);
  console.log("user: ", user);

  const isPrivileged = [
    "Manager, Payroll Administrator",
    "Manager, Employee Services Management",
    "Enterprise System Operation and Application Developer",
  ].includes(userTitle);

  const [loanRequests, setLoanRequests] = useState([]);
  const [guarantorRequests, setGuarantorRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  // Guarantor consent dialog state
  const [consentDialog, setConsentDialog] = useState(false);
  const [consentRow, setConsentRow] = useState(null);
  const [consentDecision, setConsentDecision] = useState("");
  const [consentRemarks, setConsentRemarks] = useState("");
  const [submittingConsent, setSubmittingConsent] = useState(false);

  // ── fetch my own / all requests ──────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoint = isPrivileged
        ? `${API_URL}/staff-loan-requests`
        : `${API_URL}/staff-loan-requests/creator/${encodeURIComponent(userEmail)}`;

      const [reqRes, statRes] = await Promise.all([
        axios.get(endpoint),
        axios.get(`${API_URL}/staff-loan-requests/statistics`),
      ]);

      setLoanRequests(reqRes.data.data || []);
      setStatistics(statRes.data.data || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch loan requests");
    } finally {
      setLoading(false);
    }
  };

  // ── fetch requests where I am the guarantor ──────────────────────────────
  const fetchGuarantorRequests = async () => {
    if (!userUsername) return;
    setGLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/staff-loan-requests/guarantor/${encodeURIComponent(userUsername)}`
      );
      setGuarantorRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setGLoading(false);
    }
  };

  useEffect(() => { if (userEmail) fetchAll(); }, [userEmail]);
  useEffect(() => { if (userUsername) fetchGuarantorRequests(); }, [userUsername]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan request? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/staff-loan-requests/${id}`);
      toast.success("Loan request deleted");
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const closeAdd = () => setShowAdd(false);
  const closeDetail = () => { setShowDetail(false); setSelected(null); };
  const onAddSuccess = () => { closeAdd(); fetchAll(); };

  const openConsent = (row, decision) => {
    setConsentRow(row);
    setConsentDecision(decision);
    setConsentRemarks("");
    setConsentDialog(true);
  };

  const submitConsent = async () => {
    if (!consentRow || !consentDecision) return;
    setSubmittingConsent(true);
    try {
      await axios.post(
        `${API_URL}/staff-loan-requests/${consentRow.id}/guarantor-consent`,
        { decision: consentDecision, remarks: consentRemarks }
      );
      toast.success(`You have ${consentDecision.toLowerCase()} the guarantorship for loan #${consentRow.id}.`);
      setConsentDialog(false);
      fetchGuarantorRequests();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit consent");
    } finally {
      setSubmittingConsent(false);
    }
  };

  // ── columns — MY requests ──────────────────────────────────────────────────
  const myColumns = [
    { field: "id", headerName: "#", width: 70 },
    { field: "full_name", headerName: "Employee", flex: 1, minWidth: 150 },
    ...(isPrivileged ? [{ field: "employee_id", headerName: "Emp. ID", width: 120 }] : []),
    { field: "branch_name", headerName: "Branch", flex: 1, minWidth: 130 },
    { field: "loan_type", headerName: "Loan Type", width: 110, renderCell: ({ value }) => loanTypeLabel(value) },
    { field: "loan_application_count", headerName: "App Count", width: 100, renderCell: ({ value }) => value ?? "-" },
    {
      field: "loan_amount_requested", headerName: "Amount", width: 150,
      renderCell: ({ value }) => value ? `ETB ${parseFloat(value).toLocaleString()}` : "-",
    },
    { field: "total_score_claimed", headerName: "Score", width: 80, renderCell: ({ value }) => value ?? 0 },
    {
      field: "guarantor_consent", headerName: "Guarantor Consent", width: 170,
      renderCell: ({ row, value }) => {
        // Only show if a guarantor was assigned
        if (!row.guarantor_user) return <Typography variant="caption" color="text.secondary">N/A</Typography>;
        const cfg = CONSENT_COLOR[value || "Pending"] || { color: "default", label: value || "Pending" };
        return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
      },
    },
    {
      field: "status", headerName: "Status", width: 165,
      renderCell: ({ value }) => {
        const cfg = STATUS_COLOR[value] || { color: "default", variant: "outlined" };
        return <Chip label={value || "-"} color={cfg.color} variant={cfg.variant} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
      },
    },
    {
      field: "date_of_request", headerName: "Date", width: 110,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "actions", headerName: "Actions", width: 150, sortable: false, filterable: false,
      renderCell: ({ row }) => {
        const isPending = row.status === "Pending";
        const isApproved = row.status === "Approved";
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: "100%" }}>
            <Tooltip title="View Details">
              <IconButton size="small" color="info" onClick={() => { setSelected(row); setShowDetail(true); }}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPending ? "Delete Request" : "Only available for Pending"}>
              <span>
                <IconButton size="small" color="error" disabled={!isPending}
                  onClick={() => { if (isPending) handleDelete(row.id); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {isApproved && (
              <Tooltip title="Download Approval Letter">
                <IconButton size="small" color="success" onClick={() => generateLoanPdf(row, "download")}>
                  <PdfIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ];

  // ── columns — GUARANTOR requests ──────────────────────────────────────────
  const guarantorColumns = [
    { field: "id", headerName: "#", width: 70 },
    { field: "full_name", headerName: "Borrower", flex: 1, minWidth: 150 },
    { field: "branch_name", headerName: "Branch", flex: 1, minWidth: 130 },
    { field: "loan_type", headerName: "Loan Type", width: 110, renderCell: ({ value }) => loanTypeLabel(value) },
    {
      field: "loan_amount_requested", headerName: "Amount", width: 150,
      renderCell: ({ value }) => value ? `ETB ${parseFloat(value).toLocaleString()}` : "-",
    },
    {
      field: "status", headerName: "Request Status", width: 150,
      renderCell: ({ value }) => {
        const cfg = STATUS_COLOR[value] || { color: "default", variant: "outlined" };
        return <Chip label={value || "-"} color={cfg.color} variant={cfg.variant} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
      },
    },
    {
      field: "guarantor_consent", headerName: "My Consent", width: 160,
      renderCell: ({ value }) => {
        const cfg = CONSENT_COLOR[value || "Pending"] || { color: "default", label: value || "Pending" };
        return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />;
      },
    },
    {
      field: "date_of_request", headerName: "Date", width: 110,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "guarantor_actions", headerName: "Actions", width: 210, sortable: false, filterable: false,
      renderCell: ({ row }) => {
        const alreadyDecided = row.guarantor_consent === "Accepted" || row.guarantor_consent === "Declined";
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: "100%" }}>
            <Tooltip title="View Details">
              <IconButton size="small" color="info" onClick={() => { setSelected(row); setShowDetail(true); }}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={alreadyDecided ? "You already responded" : "Accept Guarantorship"}>
              <span>
                <IconButton size="small" color="success" disabled={alreadyDecided}
                  onClick={() => openConsent(row, "Accepted")}>
                  <AcceptIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={alreadyDecided ? "You already responded" : "Decline Guarantorship"}>
              <span>
                <IconButton size="small" color="error" disabled={alreadyDecided}
                  onClick={() => openConsent(row, "Declined")}>
                  <DeclineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  const pendingGuarantorCount = guarantorRequests.filter(
    (r) => !r.guarantor_consent || r.guarantor_consent === "Pending"
  ).length;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%" }}>

      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">Dashboard</Link>
        <Typography color="text.primary">Staff Loan Requests</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Staff Loan Requests</Typography>
          <Typography variant="body2" color="text.secondary">
            {isPrivileged ? `Viewing all requests — ${userTitle}` : "Viewing your own loan requests"}
          </Typography>
        </Box>
        {/* {!isPrivileged && ( */}
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAdd(true)}>
          New Loan Request
        </Button>
        {/* )} */}
      </Box>

      {/* Statistics cards */}
      {isPrivileged && statistics && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: statistics.total_requests, color: "primary.main" },
            { label: "Pending", value: statistics.pending_count, color: "warning.main" },
            { label: "Checker Review", value: statistics.under_review_count, color: "info.main" },
            { label: "Recommended", value: statistics.recommended_count, color: "success.main" },
            { label: "Not Recommended", value: statistics.not_recommended_count, color: "error.main" },
            { label: "Emergency", value: statistics.emergency_loan_count, color: "error.dark" },
          ].map((s) => (
            <Paper key={s.label} sx={{ p: 2, flex: 1, minWidth: 110, borderRadius: 2 }}>
              <Typography variant="h6" color={s.color} fontWeight="bold">{s.value || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {!isPrivileged && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 130, borderRadius: 2 }}>
            <Typography variant="h6" color="primary.main" fontWeight="bold">{loanRequests.length}</Typography>
            <Typography variant="body2" color="text.secondary">My Requests</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 130, borderRadius: 2 }}>
            <Typography variant="h6" color="warning.main" fontWeight="bold">
              {loanRequests.filter((r) => r.status === "Pending").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 130, borderRadius: 2 }}>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {loanRequests.filter((r) => r.status === "Recommended").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Recommended</Typography>
          </Paper>
          {pendingGuarantorCount > 0 && (
            <Paper sx={{ p: 2, flex: 1, minWidth: 130, borderRadius: 2, border: "2px solid", borderColor: "warning.main" }}>
              <Typography variant="h6" color="warning.dark" fontWeight="bold">{pendingGuarantorCount}</Typography>
              <Typography variant="body2" color="text.secondary">Awaiting My Guarantor Consent</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tab label={isPrivileged ? "All Requests" : "My Loan Requests"} />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <GuarantorIcon fontSize="small" />
              <span>Guarantor Requests</span>
              {pendingGuarantorCount > 0 && (
                <Chip label={pendingGuarantorCount} color="warning" size="small"
                  sx={{ height: 18, fontSize: "0.65rem", ml: 0.5 }} />
              )}
            </Stack>
          }
        />
      </Tabs>

      {/* Tab 0 */}
      {activeTab === 0 && (
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <DataGrid
            rows={loanRequests} columns={myColumns} loading={loading}
            getRowId={(row) => row.id} autoHeight
            initialState={{ pagination: { paginationModel: { pageSize: 10 } }, sorting: { sortModel: [{ field: "id", sort: "desc" }] } }}
            pageSizeOptions={[5, 10, 25, 50]}
            slots={{ toolbar: CustomToolbar }}
            disableRowSelectionOnClick
            getRowClassName={({ row }) => {
              if (row.status === "Recommended") return "row-recommended";
              if (row.status === "Not Recommended") return "row-not-recommended";
              if (row.status === "Pending") return "row-pending";
              if (["Manager Review", "Checker Review"].includes(row.status)) return "row-review";
              return "";
            }}
            sx={gridSx}
          />
        </Paper>
      )}

      {/* Tab 1 */}
      {activeTab === 1 && (
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          {guarantorRequests.length === 0 && !gLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <GuarantorIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">
                You haven't been assigned as a guarantor on any loan request yet.
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={guarantorRequests} columns={guarantorColumns} loading={gLoading}
              getRowId={(row) => row.id} autoHeight
              initialState={{ pagination: { paginationModel: { pageSize: 10 } }, sorting: { sortModel: [{ field: "id", sort: "desc" }] } }}
              pageSizeOptions={[5, 10, 25]}
              slots={{ toolbar: CustomToolbar }}
              disableRowSelectionOnClick
              sx={gridSx}
            />
          )}
        </Paper>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={closeAdd}>
        <Box sx={modalStyle}>
          <StaffLoanRequestForm onSuccess={onAddSuccess} onCancel={closeAdd} />
        </Box>
      </Modal>

      {/* Detail Modal */}
      <Modal open={showDetail} onClose={closeDetail}>
        <Box sx={modalStyle}>
          {selected && (
            <StaffLoanRequestDetail
              request={selected}
              onClose={closeDetail}
              onRefresh={() => { fetchAll(); fetchGuarantorRequests(); }}
            />
          )}
        </Box>
      </Modal>

      {/* Guarantor Consent Dialog */}
      <Dialog open={consentDialog} onClose={() => setConsentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GuarantorIcon color={consentDecision === "Accepted" ? "success" : "error"} />
          {consentDecision === "Accepted" ? "Accept" : "Decline"} Guarantorship — Loan #{consentRow?.id}
        </DialogTitle>
        <DialogContent>
          <Alert severity={consentDecision === "Accepted" ? "success" : "warning"} sx={{ mb: 2 }}>
            {consentDecision === "Accepted"
              ? `You are confirming your willingness to act as guarantor for ${consentRow?.full_name}'s ${consentRow?.loan_type} request of ETB ${parseFloat(consentRow?.loan_amount_requested || 0).toLocaleString()}.`
              : `You are declining to act as guarantor for ${consentRow?.full_name}'s ${consentRow?.loan_type} request.`
            }
          </Alert>
          <TextField
            fullWidth multiline rows={3} label="Remarks (optional)"
            value={consentRemarks} onChange={(e) => setConsentRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsentDialog(false)} disabled={submittingConsent}>Cancel</Button>
          <Button
            variant="contained"
            color={consentDecision === "Accepted" ? "success" : "error"}
            onClick={submitConsent}
            disabled={submittingConsent}
          >
            {submittingConsent ? "Submitting..." : consentDecision === "Accepted" ? "Yes, I Accept" : "Yes, I Decline"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default StaffLoanRequestList;
