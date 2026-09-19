import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  Modal,
  CircularProgress,
  Breadcrumbs,
  Link,
  TableContainer,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";
import StaffLoanRequestForm from "./StaffLoanRequestForm";
import StaffLoanRequestDetail from "./StaffLoanRequestDetail";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";

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

const loanTypeLabel = (type) => {
  if (type === "Personal Against Suretyship") return "Personal";
  if (type === "Housing/Mortgage")            return "Housing";
  if (type === "Automobile")                  return "Automobile";
  if (type === "Emergency Loan")              return "Emergency";
  return type || "-";
};

const STATUS_BADGE = {
  "Pending":          "warning",
  "Under Review":     "info",
  "Recommended":      "success",
  "Not Recommended":  "danger",
  "Approved":         "success",
  "Rejected":         "danger",
};

// ─── Component ───────────────────────────────────────────────────────────────

const StaffLoanRequestList = () => {
  const { user } = useContext(AuthContext);

  // DataTable refs — same pattern as EmployeeList.js
  const tableRef = useRef(null);
  const [tableKey, setTableKey] = useState(0);   // incrementing forces full unmount/remount

  const [loanRequests, setLoanRequests] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [statistics,   setStatistics]   = useState(null);

  // modal state
  const [showAdd,    setShowAdd]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected,   setSelected]   = useState(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, statRes] = await Promise.all([
        axios.get(`${API_URL}/staff-loan-requests`),
        axios.get(`${API_URL}/staff-loan-requests/statistics`),
      ]);
      setLoanRequests(reqRes.data.data  || []);
      setStatistics  (statRes.data.data || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch loan requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── DataTable — identical guard pattern to EmployeeList.js ─────────────────
  useEffect(() => {
    if (loanRequests.length > 0 && tableRef.current) {
      const table = $(tableRef.current).DataTable({
        destroy: true,                    // destroy any existing instance first
        data: loanRequests,
        columns: [
          { title: "#",            data: "id",                   width: "60px" },
          { title: "Employee",     data: "full_name" },
          { title: "Emp. ID",      data: "employee_id",          width: "110px" },
          { title: "Branch",       data: "branch_name" },
          {
            title: "Loan Type", data: "loan_type", width: "100px",
            render: (d) => loanTypeLabel(d),
          },
          {
            title: "Amount", data: "loan_amount_requested",
            render: (d) => d ? `ETB ${parseFloat(d).toLocaleString()}` : "-",
          },
          {
            title: "Score", data: "total_score_claimed", width: "65px",
            render: (d) => d ?? 0,
          },
          {
            title: "Status", data: "status", width: "120px",
            render: (d) =>
              `<span class="badge bg-${STATUS_BADGE[d] || "secondary"}">${d || "-"}</span>`,
          },
          {
            title: "Date", data: "date_of_request", width: "95px",
            render: (d) => d ? new Date(d).toLocaleDateString() : "-",
          },
          {
            title: "Actions", data: null, orderable: false, width: "110px",
            render: (_, __, row) =>
              `<div style="display:flex;gap:4px;">
                 <button class="btn btn-sm btn-info    dt-view"   data-id="${row.id}" title="View">
                   <i class="fa fa-eye"></i>
                 </button>
                 <button class="btn btn-sm btn-warning  dt-edit"   data-id="${row.id}" title="Edit">
                   <i class="fa fa-edit"></i>
                 </button>
                 <button class="btn btn-sm btn-danger   dt-delete" data-id="${row.id}" title="Delete">
                   <i class="fa fa-trash"></i>
                 </button>
               </div>`,
          },
        ],
        order:      [[0, "desc"]],
        pageLength: 10,
        responsive: true,
        dom:        "Bfrtip",
        buttons:    ["copy", "csv", "excel", "print"],
        language: {
          info: "Showing _START_ to _END_ of _TOTAL_ requests",
        },
      });

      // delegated handlers on the table element
      $(tableRef.current).on("click", ".dt-view", function () {
        const row = loanRequests.find((r) => r.id === $(this).data("id"));
        if (row) { setSelected(row); setShowDetail(true); }
      });

      $(tableRef.current).on("click", ".dt-edit", function () {
        const row = loanRequests.find((r) => r.id === $(this).data("id"));
        if (row) { setSelected(row); setShowEdit(true); }
      });

      $(tableRef.current).on("click", ".dt-delete", function () {
        handleDelete($(this).data("id"));
      });

      // cleanup: destroy DataTable BEFORE React reconciles this subtree
      return () => {
        table.destroy();
      };
    }
  }, [loanRequests, tableKey]);            // tableKey remount is the safety net

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan request?")) return;
    try {
      await axios.delete(`${API_URL}/staff-loan-requests/${id}`);
      toast.success("Loan request deleted");
      fetchAll();
      setTableKey((k) => k + 1);          // force table remount after delete
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const closeAdd    = () => setShowAdd(false);
  const closeEdit   = () => { setShowEdit(false);   setSelected(null); };
  const closeDetail = () => { setShowDetail(false); setSelected(null); };

  const onAddSuccess  = () => { closeAdd();  fetchAll(); setTableKey((k) => k + 1); };
  const onEditSuccess = () => { closeEdit(); fetchAll(); setTableKey((k) => k + 1); };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%" }}>

      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">Dashboard</Link>
        <Typography color="text.primary">Staff Loan Requests</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Staff Loan Requests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAdd(true)}>
          New Loan Request
        </Button>
      </Box>

      {/* Statistics */}
      {statistics && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "Total",        value: statistics.total_requests,       color: "primary.main"  },
            { label: "Pending",      value: statistics.pending_count,        color: "warning.main"  },
            { label: "Under Review", value: statistics.under_review_count,   color: "info.main"     },
            { label: "Recommended",  value: statistics.recommended_count,    color: "success.main"  },
            { label: "Approved",     value: statistics.approved_count,       color: "success.dark"  },
            { label: "Emergency",    value: statistics.emergency_loan_count, color: "error.main"    },
          ].map((s) => (
            <Paper key={s.label} sx={{ p: 2, flex: 1, minWidth: 120 }}>
              <Typography variant="h6" color={s.color}>{s.value || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Table — key prop forces full DOM remount when tableKey changes */}
      <Paper sx={{ p: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer key={tableKey} sx={{ p: 1 }}>
            <table
              ref={tableRef}
              className="table table-striped table-hover display"
              style={{ width: "100%" }}
            />
          </TableContainer>
        )}
      </Paper>

      {/* ── Add Modal ── */}
      <Modal open={showAdd} onClose={closeAdd}>
        <Box sx={modalStyle}>
          <StaffLoanRequestForm onSuccess={onAddSuccess} onCancel={closeAdd} />
        </Box>
      </Modal>

      {/* ── Edit Modal ── */}
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
              onRefresh={() => { fetchAll(); setTableKey((k) => k + 1); }}
            />
          )}
        </Box>
      </Modal>

    </Box>
  );
};

export default StaffLoanRequestList;
