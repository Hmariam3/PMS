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
  Chip,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";
import StaffLoanRequestForm from "./StaffLoanRequestForm";
import StaffLoanRequestDetail from "./StaffLoanRequestDetail";
import { generateLoanPdf } from "./generateLoanPdf";
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

// ─── helpers ─────────────────────────────────────────────────────────────────

const loanTypeLabel = (type) => {
  if (type === "Personal Against Suretyship") return "Personal";
  if (type === "Housing/Mortgage") return "Housing";
  if (type === "Automobile") return "Automobile";
  if (type === "Emergency Loan") return "Emergency";
  return type || "-";
};

const eyeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const editSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
const trashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
const pdfSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7H20.5v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>`;

const STATUS_BADGE = {
  "Pending": "warning",
  "Manager Review": "info",
  "Checker Review": "info",
  "Recommended": "success",
  "Not Recommended": "danger",
  "Approved": "success",
  "Rejected": "danger",
};

// ─── Component ───────────────────────────────────────────────────────────────

const StaffLoanRequestList = () => {
  const { user } = useContext(AuthContext);

  const userTitle = user?.title || "";
  const userEmail = user?.MailAdress || user?.email || "";
  // privileged users see ALL requests
  const isPrivileged = ["Manager, Payroll Administrator", "Manager, Employee Services Management"].includes(userTitle);

  const tableRef = useRef(null);
  const [tableKey, setTableKey] = useState(0);
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

  // ── DataTable ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tableRef.current) return;

    const table = $(tableRef.current).DataTable({
      destroy: true,
      data: loanRequests,
      columns: [
        { title: "#", data: "id", width: "55px" },
        { title: "Employee", data: "full_name" },
        ...(isPrivileged ? [{ title: "Emp. ID", data: "employee_id", width: "110px" }] : []),
        { title: "Branch", data: "branch_name" },
        {
          title: "Loan Type", data: "loan_type", width: "95px",
          render: (d) => loanTypeLabel(d),
        },
        {
          title: "Amount", data: "loan_amount_requested",
          render: (d) => d ? `ETB ${parseFloat(d).toLocaleString()}` : "-",
        },
        {
          title: "Score", data: "total_score_claimed", width: "60px",
          render: (d) => d ?? 0,
        },
        {
          title: "Status", data: "status", width: "130px",
          render: (d) => {
            const badge = STATUS_BADGE[d] || "secondary";
            return `<span class="badge bg-${badge}">${d || "-"}</span>`;
          },
        },
        {
          title: "Date", data: "date_of_request", width: "95px",
          render: (d) => d ? new Date(d).toLocaleDateString() : "-",
        },
        {
          title: "Actions", data: null, orderable: false, width: "100px",
          render: (_, __, row) => {
            const isPending = row.status === "Pending";
            const isApproved = row.status === "Approved";
            const editBtn = isPending
              ? `<button class="btn btn-sm btn-outline-warning dt-edit" data-id="${row.id}" title="Edit Request" style="padding:3px 7px">
                   ${editSvg}
                 </button>`
              : `<button class="btn btn-sm btn-outline-secondary" disabled title="Edit only available for Pending requests" style="padding:3px 7px;opacity:0.35">
                   ${editSvg}
                 </button>`;
            const delBtn = isPending
              ? `<button class="btn btn-sm btn-outline-danger dt-delete" data-id="${row.id}" title="Delete Request" style="padding:3px 7px">
                   ${trashSvg}
                 </button>`
              : `<button class="btn btn-sm btn-outline-secondary" disabled title="Delete only available for Pending requests" style="padding:3px 7px;opacity:0.35">
                   ${trashSvg}
                 </button>`;
            const pdfBtn = isApproved
              ? `<button class="btn btn-sm btn-success dt-pdf" data-id="${row.id}" title="Download Approval Letter" style="padding:3px 7px;color:white">
                   ${pdfSvg}
                 </button>`
              : "";
            return `<div style="display:flex;gap:4px;align-items:center;">
                      <button class="btn btn-sm btn-outline-info dt-view" data-id="${row.id}" title="View Details" style="padding:3px 7px">
                        ${eyeSvg}
                      </button>
                      ${editBtn}
                      ${delBtn}
                      ${pdfBtn}
                    </div>`;
          },
        },
      ],
      order: [[0, "desc"]],
      pageLength: 10,
      responsive: true,
      dom: "Bfrtip",
      buttons: ["copy", "csv", "excel", "print"],
      language: {
        search: "Search:",
        info: "Showing _START_ to _END_ of _TOTAL_ requests",
        emptyTable: "No loan requests found",
        zeroRecords: "No matching requests found",
      },
      // Row callback — highlight rows by status
      rowCallback: (row, data) => {
        if (data.status === "Recommended") row.style.borderLeft = "4px solid #2e7d32";
        if (data.status === "Not Recommended") row.style.borderLeft = "4px solid #c62828";
        if (data.status === "Pending") row.style.borderLeft = "4px solid #ed6c02";
        if (data.status === "Manager Review" || data.status === "Checker Review")
          row.style.borderLeft = "4px solid #0288d1";
      },
    });

    $(tableRef.current).on("click", ".dt-view", function () {
      const row = loanRequests.find((r) => r.id === $(this).data("id"));
      if (row) { setSelected(row); setShowDetail(true); }
    });

    $(tableRef.current).on("click", ".dt-edit", function () {
      const row = loanRequests.find((r) => r.id === $(this).data("id"));
      if (row && row.status === "Pending") { setSelected(row); setShowEdit(true); }
    });

    $(tableRef.current).on("click", ".dt-delete", function () {
      const row = loanRequests.find((r) => r.id === $(this).data("id"));
      if (row && row.status === "Pending") handleDelete($(this).data("id"));
    });

    $(tableRef.current).on("click", ".dt-pdf", function () {
      const row = loanRequests.find((r) => r.id === $(this).data("id"));
      if (row) generateLoanPdf(row, "download");
    });

    return () => { table.destroy(); };
  }, [loanRequests, tableKey]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan request? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/staff-loan-requests/${id}`);
      toast.success("Loan request deleted");
      fetchAll();
      setTableKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const closeAdd = () => setShowAdd(false);
  const closeEdit = () => { setShowEdit(false); setSelected(null); };
  const closeDetail = () => { setShowDetail(false); setSelected(null); };

  const onAddSuccess = () => { closeAdd(); fetchAll(); setTableKey((k) => k + 1); };
  const onEditSuccess = () => { closeEdit(); fetchAll(); setTableKey((k) => k + 1); };

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
            <Paper key={s.label} sx={{ p: 2, flex: 1, minWidth: 110 }}>
              <Typography variant="h6" color={s.color}>{s.value || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* My request summary for regular staff */}
      {!isPrivileged && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 130 }}>
            <Typography variant="h6" color="primary.main">{loanRequests.length}</Typography>
            <Typography variant="body2" color="text.secondary">My Requests</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 130 }}>
            <Typography variant="h6" color="warning.main">
              {loanRequests.filter(r => r.status === "Pending").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 130 }}>
            <Typography variant="h6" color="success.main">
              {loanRequests.filter(r => r.status === "Recommended").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Recommended</Typography>
          </Paper>
        </Box>
      )}

      {/* Table */}
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
              onRefresh={() => { fetchAll(); setTableKey((k) => k + 1); }}
            />
          )}
        </Box>
      </Modal>

    </Box>
  );
};

export default StaffLoanRequestList;
