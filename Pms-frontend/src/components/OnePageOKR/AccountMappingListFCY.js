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
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  Clear as ClearIcon,
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

const AccountMappingListFCY = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [mapping, setMapping] = useState({
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

  const fetchMappings = async () => {
    try {
      const requestData = {
        user_id: user.UserName,
        position: user.position,
        process: user.process || null,
        subprocess: user.subprocess || null,
      };
      setLoading(true);
      const res = await axios.post(
        `${baseUrl}/accountmappingfcy/getFcyAccountMappingsByUser`,
        requestData,
      );
      setMappings(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async () => {
    if (!mapping.account_number) {
      setErrors({ account_number: "Account number required" });
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
        account_number: mapping.account_number.trim(),
        account_holder: data.name,
        currency: data.currency,
        beginning_balance: parseFloat(data.workingBalance.replace(/,/g, "")),
        current_balance: parseFloat(data.workingBalance.replace(/,/g, "")),
        customer_id: data.customer_id,
        company_code: data.campany_code,
        user_name: user?.UserName || "",
        process: user?.process || "",
        subprocess: user?.subprocess || "",
        team: user?.team || "",
        district: user?.process_name || "",
        branch: user?.team || "",
        crm_name: user?.FullName || "",
      };

      setMapping(updatedMapping);

      if (data?.name) {
        setIsDisabled(true);
        setErrors({});
      }

      if (updatedMapping.company_code) {
        try {
          const branchRes = await axios.get(
            `${baseUrl}/branches/getBranchByCode/${updatedMapping.company_code}`,
          );
          const branchData = branchRes.data;
          setMapping((prev) => ({
            ...prev,
            district: branchData.process_name || "",
            branch: branchData.branch_name || "",
            campany_code: updatedMapping.company_code,
          }));
        } catch (err) {
          console.error("Error fetching branch data mapping:", err);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching account balance");
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
        pageLength: 10,
        responsive: true,
      });
      return () => table.destroy();
    }
  }, [mappings]);

  const handleShow = () => {
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
    setErrors({});
    setIsDisabled(false);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMapping({ ...mapping, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mapping.account_number || !mapping.account_holder) {
      toast.error("Account validation required");
      return;
    }
    if (mapping.currency === "ETB") {
      toast.error("ETB accounts not allowed for FCY mapping");
      return;
    }

    try {
      setLoading(true);
      if (mapping.map_id) {
        await axios.put(`${baseUrl}/accountmappingfcy/${mapping.map_id}`, mapping);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${baseUrl}/accountmappingfcy`, mapping);
        toast.success("Created successfully");
      }
      fetchMappings();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setMapping(m);
    setIsDisabled(true);
    setShowForm(true);
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
    link.setAttribute("download", "fcy_account_mapping_template.xlsx");
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
      const res = await axios.post(`${baseUrl}/accountMappingFCY/import-excel`, formData, {
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
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/accountmappingfcy/${id}`);
      toast.success("Deleted successfully");
      fetchMappings();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
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
            FCY Account Mappings
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">One Page OKR</Typography>
            <Typography color="text.primary">FCY Mapping</Typography>
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
            startIcon={<EditIcon />}
            onClick={handleShow}
            Color="info"
          >
            Add Account Mapping
          </Button>
        </Stack>
      </Stack>
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Holder</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>District</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer ID</TableCell>
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
                  <TableCell>{m.team}</TableCell>
                  <TableCell>{m.district}</TableCell>
                  <TableCell>{m.branch}</TableCell>
                  <TableCell>{m.customer_id}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {/* <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(m)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip> */}
                      {/* <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(m.map_id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip> */}
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
        onClose={() => setShowForm(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {mapping.map_id ? "Edit Mapping" : "Add Mapping"}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      name="account_number"
                      value={mapping.account_number}
                      onChange={handleChange}
                      disabled={isDisabled}
                      error={!!errors.account_number}
                      helperText={errors.account_number}
                      size="small"
                      required
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={getBalance}
                        disabled={loading || isDisabled}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Validate
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ClearIcon />}
                        onClick={handleClear}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Clear
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account Holder"
                    value={mapping.account_holder}
                    InputProps={{ readOnly: true }}
                    size="small"
                    placeholder="Validated from CBS"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value={mapping.currency}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="District"
                    value={mapping.district}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Branch"
                    value={mapping.branch}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer ID"
                    value={mapping.customer_id}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Code"
                    value={mapping.campany_code}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!mapping.account_holder}
                  Color="info"
                >
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

export default AccountMappingListFCY;
