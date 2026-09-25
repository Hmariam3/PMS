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
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
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

const ROW_BORDER = {
  Recommended: "#2e7d32",
  "Not Recommended": "#c62828",
  Pending: "#ed6c02",
  "Manager Review": "#0288d1",
  "Checker Review": "#0288d1",
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
  // privileged users see ALL requests
  const isPrivileged = ["Manager, Payroll Administrator", "Manager, Employee Services Management"].includes(userTitle);

  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  // ── fetch — endpoint depends on role ──────────────────────────────────────
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

  useEffect(() => {
    if (userEmail) fetchAll();
  }, [userEmail]);

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
  const closeEdit = () => { setShowEdit(false); setSelected(null); };
  const closeDetail = () => { setShowDetail(false); setSelected(null); };

  const onAddSuccess = () => { closeAdd(); fetchAll(); };
  const onEditSuccess = () => { closeEdit(); fetchAll(); };

  // ── columns ────────────────────────────────────────────────────────────────
  const columns = [
    { field: "id", headerName: "#", width: 70 },
    { field: "full_name", headerName: "Employee", flex: 1, minWidth: 150 },
    ...(isPrivileged ? [{ field: "employee_id", headerName: "Emp. ID", width: 120 }] : []),
    { field: "branch_name", headerName: "Branch", flex: 1, minWidth: 130 },
    {
      field: "loan_type",
      headerName: "Loan Type",
      width: 110,
      renderCell: ({ value }) => loanTypeLabel(value),
    },
    {
      field: "loan_application_count",
      headerName: "App Count",
      width: 100,
      renderCell: ({ value }) => value ?? "-",
    },
    {
      field: "loan_amount_requested",
      headerName: "Amount",
      width: 150,
      renderCell: ({ value }) =>
        value ? `ETB ${parseFloat(value).toLocaleString()}` : "-",
    },
    {
      field: "total_score_claimed",
      headerName: "Score",
      width: 80,
      renderCell: ({ value }) => value ?? 0,
    },
    {
      field: "status",
      headerName: "Status",
      width: 165,
      renderCell: ({ value }) => {
        const cfg = STATUS_COLOR[value] || { color: "default", variant: "outlined" };
        return (
          <Chip
            label={value || "-"}
            color={cfg.color}
            variant={cfg.variant}
            size="small"
            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
          />
        );
      },
    },
    {
      field: "date_of_request",
      headerName: "Date",
      width: 110,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const isPending = row.status === "Pending";
        const isApproved = row.status === "Approved";
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: "100%" }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="info"
                onClick={() => { setSelected(row); setShowDetail(true); }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* <Tooltip title={isPending ? "Edit Request" : "Only available for Pending"}>
              <span>
                <IconButton
                  size="small"
                  color="warning"
                  disabled={!isPending}
                  onClick={() => { if (isPending) { setSelected(row); setShowEdit(true); } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip> */}
            <Tooltip title={isPending ? "Delete Request" : "Only available for Pending"}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!isPending}
                  onClick={() => { if (isPending) handleDelete(row.id); }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {isApproved && (
              <Tooltip title="Download Approval Letter">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => generateLoanPdf(row, "download")}
                >
                  <PdfIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ];

  // ── statistics cards — only for privileged users ───────────────────────────
  const statsCards = [
    { label: "Total", value: statistics?.total_requests, color: "primary.main" },
    { label: "Pending", value: statistics?.pending_count, color: "warning.main" },
    { label: "Checker Review", value: statistics?.under_review_count, color: "info.main" },
    { label: "Recommended", value: statistics?.recommended_count, color: "success.main" },
    { label: "Not Recommended", value: statistics?.not_recommended_count, color: "error.main" },
    { label: "Emergency", value: statistics?.emergency_loan_count, color: "error.dark" },
  ];

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
            {isPrivileged
              ? `Viewing all requests — ${userTitle}`
              : "Viewing your own loan requests"}
          </Typography>
        </Box>
        {/* Only non-privileged staff can create new requests */}
        {!isPrivileged && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAdd(true)}>
            New Loan Request
          </Button>
        )}
      </Box>

      {/* Statistics — only for privileged users */}
      {isPrivileged && statistics && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {statsCards.map((s) => (
            <Paper key={s.label} sx={{ p: 2, flex: 1, minWidth: 110, borderRadius: 2 }}>
              <Typography variant="h6" color={s.color} fontWeight="bold">{s.value || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* My request summary for regular staff */}
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
        </Box>
      )}

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <DataGrid
          rows={loanRequests}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          autoHeight
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: "id", sort: "desc" }] },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          slots={{ toolbar: CustomToolbar }}
          disableRowSelectionOnClick
          getRowClassName={({ row }) => {
            if (row.status === "Recommended") return "row-recommended";
            if (row.status === "Not Recommended") return "row-not-recommended";
            if (row.status === "Pending") return "row-pending";
            if (row.status === "Manager Review" || row.status === "Checker Review")
              return "row-review";
            return "";
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "primary.main",
              color: "#000",
              fontSize: "0.85rem",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              color: "#000",
            },
            "& .MuiDataGrid-columnHeader .MuiIconButton-root": {
              color: "#000",
            },
            "& .MuiDataGrid-columnHeader .MuiSvgIcon-root": {
              color: "#000",
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            "& .row-recommended": { borderLeft: `4px solid ${ROW_BORDER.Recommended}` },
            "& .row-not-recommended": { borderLeft: `4px solid ${ROW_BORDER["Not Recommended"]}` },
            "& .row-pending": { borderLeft: `4px solid ${ROW_BORDER.Pending}` },
            "& .row-review": { borderLeft: `4px solid ${ROW_BORDER["Manager Review"]}` },
            "& .MuiDataGrid-cell": { alignItems: "center" },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid",
              borderColor: "divider",
            },
          }}
        />
      </Paper>

      {/* ── Add Modal ── */}
      <Modal open={showAdd} onClose={closeAdd}>
        <Box sx={modalStyle}>
          <StaffLoanRequestForm onSuccess={onAddSuccess} onCancel={closeAdd} />
        </Box>
      </Modal>

      {/* ── Edit Modal — renders the same form component as Add ── */}
      <Modal open={showEdit} onClose={closeEdit}>
        <Box sx={modalStyle}>
          {selected && (
            <StaffLoanRequestForm
              existingRequest={selected}
              onSuccess={onEditSuccess}
              onCancel={closeEdit}
            />
          )}
        </Box>
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal open={showDetail} onClose={closeDetail}>
        <Box sx={modalStyle}>
          {selected && (
            <StaffLoanRequestDetail
              request={selected}
              onClose={closeDetail}
              onRefresh={() => fetchAll()}
            />
          )}
        </Box>
      </Modal>

    </Box>
  );
};

export default StaffLoanRequestList;

