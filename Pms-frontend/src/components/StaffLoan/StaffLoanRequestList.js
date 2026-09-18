import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
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
  Chip,
} from "@mui/material";

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
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
  width: { xs: "95%", md: "90%", lg: 1400 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const StaffLoanRequestList = () => {
  const { user } = useContext(AuthContext);
  const tableRef = useRef();
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tableKey, setTableKey] = useState(0);
  const [statistics, setStatistics] = useState(null);

  // Fetch all loan requests
  const fetchLoanRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/staff-loan-requests`);
      setLoanRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching loan requests:", error);
      toast.error("Failed to fetch loan requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/staff-loan-requests/statistics`);
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  useEffect(() => {
    fetchLoanRequests();
    fetchStatistics();
  }, []);

  // Initialize DataTable
  useEffect(() => {
    if (loanRequests.length > 0 && tableRef.current) {
      // Destroy existing DataTable instance
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }

      // Initialize new DataTable
      $(tableRef.current).DataTable({
        data: loanRequests,
        columns: [
          {
            title: "Request ID",
            data: "id",
            width: "80px",
          },
          {
            title: "Employee Name",
            data: "full_name",
          },
          {
            title: "Employee ID",
            data: "employee_id",
            width: "120px",
          },
          {
            title: "Branch",
            data: "branch_name",
          },
          {
            title: "Loan Type",
            data: "loan_type",
            render: (data) => {
              if (data === "Personal Against Suretyship") return "Personal";
              if (data === "Housing/Mortgage") return "Housing";
              if (data === "Automobile") return "Automobile";
              return data;
            },
          },
          {
            title: "Amount",
            data: "loan_amount_requested",
            render: (data) => {
              return data ? `ETB ${parseFloat(data).toLocaleString()}` : "-";
            },
          },
          {
            title: "Score",
            data: "total_score_claimed",
            width: "70px",
            render: (data) => `${data || 0}`,
          },
          {
            title: "Status",
            data: "status",
            width: "120px",
            render: (data) => {
              let color = "default";
              if (data === "Pending") color = "warning";
              if (data === "Under Review") color = "info";
              if (data === "Recommended") color = "success";
              if (data === "Not Recommended") color = "error";
              if (data === "Approved") color = "success";
              if (data === "Rejected") color = "error";
              return `<span class="badge bg-${color}">${data}</span>`;
            },
          },
          {
            title: "Date",
            data: "date_of_request",
            width: "110px",
            render: (data) => {
              return data ? new Date(data).toLocaleDateString() : "-";
            },
          },
          {
            title: "Actions",
            data: null,
            orderable: false,
            width: "150px",
            render: (data, type, row) => {
              return `
                <div style="display: flex; gap: 5px;">
                  <button class="btn btn-sm btn-info view-btn" data-id="${row.id}" title="View Details">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-warning edit-btn" data-id="${row.id}" title="Edit">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id}" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              `;
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
          lengthMenu: "Show _MENU_ entries",
          info: "Showing _START_ to _END_ of _TOTAL_ loan requests",
        },
      });

      // Event handlers for action buttons
      $(tableRef.current).on("click", ".view-btn", function () {
        const id = $(this).data("id");
        handleView(id);
      });

      $(tableRef.current).on("click", ".edit-btn", function () {
        const id = $(this).data("id");
        handleEdit(id);
      });

      $(tableRef.current).on("click", ".delete-btn", function () {
        const id = $(this).data("id");
        handleDelete(id);
      });
    }

    return () => {
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, [loanRequests, tableKey]);

  const handleView = (id) => {
    const request = loanRequests.find((req) => req.id === id);
    if (request) {
      setSelectedRequest(request);
      setShowDetailModal(true);
    }
  };

  const handleEdit = (id) => {
    const request = loanRequests.find((req) => req.id === id);
    if (request) {
      setSelectedRequest(request);
      setShowEditModal(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this loan request?")) {
      try {
        await axios.delete(`${API_URL}/staff-loan-requests/${id}`);
        toast.success("Loan request deleted successfully");
        fetchLoanRequests();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting loan request:", error);
        toast.error("Failed to delete loan request");
      }
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchLoanRequests();
    fetchStatistics();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedRequest(null);
    fetchLoanRequests();
    fetchStatistics();
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "warning",
      "Under Review": "info",
      Recommended: "success",
      "Not Recommended": "error",
      Approved: "success",
      Rejected: "error",
    };
    return colors[status] || "default";
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">
          Dashboard
        </Link>
        <Typography color="text.primary">Staff Loan Requests</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Staff Loan Requests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowAddModal(true)}
        >
          New Loan Request
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="primary">
              {statistics.total_requests || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Requests
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="warning.main">
              {statistics.pending_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="info.main">
              {statistics.under_review_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Under Review
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="success.main">
              {statistics.recommended_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recommended
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
            <Typography variant="h6" color="success.dark">
              {statistics.approved_count || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Data Table */}
      <Paper sx={{ width: "100%", overflow: "hidden", p: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <table
            ref={tableRef}
            className="table table-striped table-bordered"
            style={{ width: "100%" }}
          />
        )}
      </Paper>

      {/* Add Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showAddModal}>
          <Box sx={modalStyle}>
            <StaffLoanRequestForm
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddModal(false)}
            />
          </Box>
        </Fade>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRequest(null);
        }}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showEditModal}>
          <Box sx={modalStyle}>
            <StaffLoanRequestForm
              existingRequest={selectedRequest}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedRequest(null);
              }}
            />
          </Box>
        </Fade>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showDetailModal}>
          <Box sx={modalStyle}>
            <StaffLoanRequestDetail
              request={selectedRequest}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedRequest(null);
              }}
              onRefresh={() => {
                fetchLoanRequests();
                fetchStatistics();
              }}
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default StaffLoanRequestList;
