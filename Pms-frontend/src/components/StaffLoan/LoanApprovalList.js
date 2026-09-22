import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Modal,
  CircularProgress,
  Breadcrumbs,
  Link,
  Alert,
  IconButton,
  Tooltip,
  Stack,
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

// ─── Custom toolbar ───────────────────────────────────────────────────────────
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

const LoanApprovalList = () => {
  const { user } = useContext(AuthContext);

  const userTitle = user?.title || "";
  const isApprover = (userTitle === "Employee Approver" || userTitle === "Enterprise System Operation and Application Developer");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/staff-loan-requests/recommended`);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recommended requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isApprover) {
      fetchAll();
    }
  }, [isApprover]);

  const closeDetail = () => { setShowDetail(false); setSelected(null); };
  const onApproved = () => { closeDetail(); fetchAll(); };

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
      field: "date_of_request",
      headerName: "Date",
      width: 110,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
          <Tooltip title="View Full Details">
            <IconButton
              size="small"
              color="info"
              onClick={() => { setSelected(row); setShowDetail(true); }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isApprover && (
            <Tooltip title="Give Final Approval">
              <IconButton
                size="small"
                color="success"
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

  if (!isApprover) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This page is only accessible to the <strong>Employee Approver</strong>.
        </Alert>
      </Box>
    );
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
          Recommended requests awaiting your final approval
        </Typography>
      </Box>

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

