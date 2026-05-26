import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
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
  TextField,
  Divider,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
} from "@mui/icons-material";
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

const AccountMappingList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [mapping, setMapping] = useState({
    account_number: "",
    account_holder: "",
    beginning_balance: 0,
    currency: "",
    current_balance: 0,
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    district: "",
    branch: "",
    customer_id: "",
    crm_name: "",
    campany_code: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchMappings = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${baseUrl}/accountmapping/getAccountMappingsByUser`,
        requestData,
      );
      setMappings(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch account mappings");
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async () => {
    if (!mapping.account_number) {
      toast.error("Please enter an account number first");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/cbs/account-balance`, {
        accountNumber: mapping.account_number,
      });

      const data = res.data.data;
      const updatedMapping = {
        ...mapping,
        account_holder: data.name,
        currency: data.currency,
        beginning_balance: parseFloat(data.workingBalance.replace(/,/g, "")),
        current_balance: parseFloat(data.workingBalance.replace(/,/g, "")),
        customer_id: data.customer_id,
        campany_code: data.campany_code,
        user_name: user?.UserName || "",
        district: user?.process_name || "",
        branch: user?.team || "",
        crm_name: user?.FullName || "",
      };

      setMapping(updatedMapping);

      if (data?.name) {
        setIsDisabled(true);
        setErrors({});
      }

      if (data.campany_code) {
        try {
          const branchRes = await axios.get(
            `${baseUrl}/branches/getBranchByCode/${data.campany_code}`,
          );
          const branchData = branchRes.data;
          setMapping((prev) => ({
            ...prev,
            district: branchData.process_name || "",
            branch: branchData.branch_name || "",
          }));
        } catch (err) {
          console.error("Error fetching branch data:", err);
        }
      }
    } catch (error) {
      console.error("Balance fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch account details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  useEffect(() => {
    if (mappings.length > 0) {
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
  }, [mappings]);

  const handleShow = () => {
    setMapping({
      account_number: "",
      account_holder: "",
      beginning_balance: 0,
      current_balance: 0,
      user_name: user?.UserName || "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      district: "",
      branch: "",
      customer_id: "",
      crm_name: "",
      currency: "",
      campany_code: "",
    });
    setErrors({});
    setIsDisabled(false);
    setShowForm(true);
  };

  const handleClose = () => setShowForm(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMapping({ ...mapping, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mapping.account_number || !mapping.account_holder) {
      toast.error("Account Number and Holder are required");
      return;
    }

    if (user.position !== "CRM" && user.organization === "Branch") {
      if (user.company_code?.trim() !== mapping.campany_code?.trim()) {
        toast.error("Account Number is not from your Branch");
        return;
      }
    }

    if (mapping.currency !== "ETB") {
      toast.error("Account Currency Not Allowed (ETB only)");
      return;
    }

    if (mapping.account_number.length < 8) {
      toast.error("Account must be at least 8 digits");
      return;
    }

    try {
      setLoading(true);
      if (mapping.map_id) {
        await axios.put(`${baseUrl}/accountmapping/${mapping.map_id}`, {
          ...mapping,
          user_name: user?.UserName,
        });
        toast.success("Account mapping updated");
      } else {
        await axios.post(`${baseUrl}/accountmapping`, {
          ...mapping,
          user_name: user?.UserName,
          created_at: new Date().toISOString(),
        });
        toast.success("Account mapping added");
      }
      fetchMappings();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setMapping(m);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/accountmapping/${id}`);
      toast.success("Account mapping deleted");
      fetchMappings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "account_number": "12345678",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "account_mapping_template.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_name", user?.UserName);
    formData.append("process", user?.process || "");
    formData.append("subprocess", user?.subprocess || "");
    formData.append("team", user?.team || "");

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/accountmapping/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { summary } = res.data;
      toast.success(`Import complete: ${summary.successCount} success, ${summary.errorCount} failed, ${summary.skippedCount} skipped`);

      if (summary.errorCount > 0) {
        console.table(res.data.results.errors);
      }

      fetchMappings();
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMapping({
      account_number: "",
      account_holder: "",
      currency: "",
      beginning_balance: 0,
      current_balance: 0,
      user_name: user?.UserName || "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      district: "",
      branch: "",
      customer_id: "",
      crm_name: "",
      campany_code: "",
    });
    setIsDisabled(false);
    setErrors({});
  };

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
            Account Mappings
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">Mappings</Typography>
          </Breadcrumbs>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleDownloadTemplate}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Template
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Select Excel
              <input
                type="file"
                hidden
                accept=".xlsx, .xls"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </Button>
            {selectedFile && (
              <Typography variant="caption" sx={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedFile.name}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleUpload}
              size="small"
              disabled={!selectedFile}
              color="secondary"
              sx={{ textTransform: "none" }}
            >
              Upload
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleShow}
            Color="info"
          >
            Add Mapping
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account Holder</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Beg. Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cur. Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.map_id} hover>
                  <TableCell>{m.map_id}</TableCell>
                  <TableCell>{m.account_number}</TableCell>
                  <TableCell>{m.account_holder}</TableCell>
                  <TableCell>{m.beginning_balance?.toLocaleString()}</TableCell>
                  <TableCell>{m.current_balance?.toLocaleString()}</TableCell>
                  <TableCell>{m.user_name}</TableCell>
                  <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEdit(m)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(m.map_id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {mapping.map_id ? "Edit" : "Add"} Account Mapping
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    name="account_number"
                    value={mapping.account_number}
                    onChange={handleChange}
                    disabled={isDisabled}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={getBalance}
                      disabled={loading || isDisabled}
                      fullWidth
                    >
                      Validate
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClear}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Holder"
                    name="account_holder"
                    value={mapping.account_holder}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="District"
                    name="district"
                    value={mapping.district}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Branch"
                    name="branch"
                    value={mapping.branch}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer ID"
                    name="customer_id"
                    value={mapping.customer_id}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Code"
                    name="campany_code"
                    value={mapping.campany_code}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Currency"
                    name="currency"
                    value={mapping.currency}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {mapping.map_id ? "Update Mapping" : "Save Mapping"}
                </Button>
              </Box>
            </form>
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

export default AccountMappingList;
