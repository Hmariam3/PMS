import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Modal,
  CircularProgress,
  Breadcrumbs,
  Link,
  TableContainer,
  Alert,
} from "@mui/material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";
import LoanApprovalDetail from "./LoanApprovalDetail";
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

const loanTypeLabel = (t) => {
  if (t === "Personal Against Suretyship") return "Personal";
  if (t === "Housing/Mortgage") return "Housing";
  if (t === "Automobile") return "Automobile";
  if (t === "Emergency Loan") return "Emergency";
  return t || "-";
};

const eyeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

const LoanApprovalList = () => {
  const { user } = useContext(AuthContext);

  const userTitle = user?.title || "";
  const isApprover = (userTitle === "Employee Approver" || userTitle === "Enterprise System Operation and Application Developer");

  const tableRef = useRef(null);
  const [tableKey, setTableKey] = useState(0);
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

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!tableRef.current) return;

    const table = $(tableRef.current).DataTable({
      destroy: true,
      data: requests,
      columns: [
        { title: "#", data: "id", width: "55px" },
        { title: "Employee", data: "full_name" },
        { title: "Emp. ID", data: "employee_id", width: "110px" },
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
          title: "Date", data: "date_of_request", width: "95px",
          render: (d) => d ? new Date(d).toLocaleDateString() : "-",
        },
        {
          title: "Actions", data: null, orderable: false, width: "110px",
          render: (_, __, row) =>
            `<div style="display:flex;gap:4px;align-items:center;">
               <button class="btn btn-sm btn-outline-info  dt-view"    data-id="${row.id}" title="View Full Details" style="padding:3px 7px">${eyeSvg}</button>
               ${isApprover
              ? `<button class="btn btn-sm btn-success dt-approve" data-id="${row.id}" title="Give Final Approval" style="padding:3px 7px;color:white">${checkSvg} Approve</button>`
              : ""}
             </div>`,
        },
      ],
      order: [[0, "desc"]],
      pageLength: 10,
      responsive: true,
      dom: "Bfrtip",
      buttons: ["copy", "csv", "excel", "print"],
      language: {
        emptyTable: "No recommended requests awaiting approval",
        info: "Showing _START_ to _END_ of _TOTAL_ requests",
      },
      rowCallback: (row) => { row.style.borderLeft = "4px solid #2e7d32"; },
    });

    $(tableRef.current).on("click", ".dt-view", function () {
      const row = requests.find((r) => r.id === $(this).data("id"));
      if (row) { setSelected(row); setShowDetail(true); }
    });

    $(tableRef.current).on("click", ".dt-approve", function () {
      const row = requests.find((r) => r.id === $(this).data("id"));
      if (row) { setSelected(row); setShowDetail(true); }
    });

    return () => { table.destroy(); };
  }, [requests, tableKey, isApprover]);

  const closeDetail = () => { setShowDetail(false); setSelected(null); };

  const onApproved = () => { closeDetail(); fetchAll(); setTableKey((k) => k + 1); };

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

      <Paper sx={{ p: 2 }}>
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
