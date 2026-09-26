import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Modal,
  Breadcrumbs,
  Link,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
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
import LoanApprovalDetail from "./LoanApprovalDetail";

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

const loanTypeLabel = (t) => {
  if (t === "Personal Against Suretyship") return "Personal";
  if (t === "Housing/Mortgage") return "Housing";
  if (t === "Automobile") return "Automobile";
  if (t === "Emergency Loan") return "Emergency";
  return t || "-";
};

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1, gap: 1 }}>
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        csvOptions={{ fileName: "loan_approvals" }}
        printOptions={{ fileName: "loan_approvals" }}
      />
    </GridToolbarContainer>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const LoanApprovalList = () => {
  const { user } = useContext(AuthContext);

  const userTitle    = user?.title    || "";
  const userFullName = user?.full_name || "";

  // Two roles that can see this page:
  // 1. Employee Approver — sees ALL recommended requests, can give final approval
  // 2. Assigned branch user — sees only requests where loan_processor_assigned matches their name
  const isApprover = (
    userTitle === "Employee Approver" ||
    userTitle === "Enterprise System Operation and Application Developer"
  );

  // A user is an assigned processor if they have at least one request assigned to them.
  // We determine access client-side after fetch; if they got results they have access.
  // We pass their full name to the API to filter.
  const isAssignedProcessor = !isApprover && !!userFullName;

  const canAccess = isApprover || isAssignedProcessor;

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Approver gets everything; assigned processor gets only their requests
      const params = isApprover ? {} : { assignedTo: userFullName };
      const res = await axios.get(`${API_URL}/staff-loan-requests/recommended`, { params });
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recommended requests");
    } finally {
      setLoading(false);
      setAccessChecked(true);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchAll();
    } else {
      setAccessChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeDetail = () => { setShowDetail(false); setSelected(null); };
  const onApproved  = () => { closeDetail(); fetchAll(); };

  // ── columns ────────────────────────────────────────────────────────────────
  const columns = [
    { field: "id", headerName: "#", width: 70 },
    { field: "full_name", headerName: "Employee", flex: 1, minWidth: 150 },
    { field: "employee_id", headerName: "Emp. ID", width: 120 },
    { field: "branch_name", headerName: "Branch", flex: 1, minWidth: 130 },
    {
      field: "loan_type",
      headerName: "Loan Type",
      width: 110,
      renderCell: ({ value }) => loanTypeLabel(value),
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
      field: "loan_processing_branch",
      headerName: "Processing Branch",
      flex: 1,
      minWidth: 140,
      renderCell: ({ value }) => value || "-",
    },
    {
      field: "loan_processor_assigned",
      headerName: "Assigned Processor",
      flex: 1,
      minWidth: 170,
      renderCell: ({ value }) =>
        value
          ? <Chip label={value} size="small" color="info" variant="outlined" sx={{ fontSize: "0.72rem" }} />
          : <Typography variant="caption" color="text.secondary">Not assigned</Typography>,
    },
    {
      field: "special_review",
      headerName: "Special Review",
      width: 130,
      renderCell: ({ value }) =>
        value
          ? <Chip label="⚠️ Special Review" color="warning" size="small" />
          : <Chip label="Standard" color="default" size="small" variant="outlined" />,
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
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
          <Tooltip title="View Full Details">
            <IconButton
              size="small" color="info"
              onClick={() => { setSelected(row); setShowDetail(true); }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isApprover && (
            <Tooltip title="Give Final Approval">
              <IconButton
                size="small" color="success"
                onClick={() => { setSelected(row); setShowDetail(true); }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  // ── access guard ──────────────────────────────────────────────────────────
  if (!accessChecked) return null; // still loading

  if (!canAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This page is only accessible to the{" "}
          <strong>Employee Approver</strong> or an assigned loan processor.
        </Alert>
      </Box>
    );
  }

  // After fetch, if assigned processor has zero results they have no assigned requests
  if (!isApprover && accessChecked && !loading && requests.length === 0) {
    // Still show the page — they just have nothing assigned yet
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">Dashboard</Link>
        <Typography color="text.primary">Loan Approvals</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Loan Approvals</Typography>
        <Typography variant="body2" color="text.secondary">
          {isApprover
            ? "All recommended requests awaiting final approval"
            : `Recommended requests assigned to you — ${userFullName}`}
        </Typography>
      </Box>

      {/* Summary chips */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 130, borderRadius: 2 }}>
          <Typography variant="h6" color="success.main" fontWeight="bold">
            {requests.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isApprover ? "Recommended" : "Assigned to Me"}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 130, borderRadius: 2 }}>
          <Typography variant="h6" color="warning.main" fontWeight="bold">
            {requests.filter((r) => r.special_review).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">Special Review</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 130, borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" fontWeight="bold">
            {requests.filter((r) => !r.loan_processor_assigned).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">Not Yet Assigned</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <DataGrid
          rows={requests}
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
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "primary.main",
              color: "#000",
              fontSize: "0.85rem",
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#000" },
            "& .MuiDataGrid-columnHeader .MuiIconButton-root": { color: "#000" },
            "& .MuiDataGrid-columnHeader .MuiSvgIcon-root": { color: "#000" },
            "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            "& .MuiDataGrid-row": { borderLeft: "4px solid #2e7d32" },
            "& .MuiDataGrid-cell": { alignItems: "center" },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid",
              borderColor: "divider",
            },
          }}
        />
      </Paper>

      <Modal open={showDetail} onClose={closeDetail}>
        <Box sx={modalStyle}>
          {selected && (
            <LoanApprovalDetail
              request={selected}
              onClose={closeDetail}
              onApproved={onApproved}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default LoanApprovalList;
