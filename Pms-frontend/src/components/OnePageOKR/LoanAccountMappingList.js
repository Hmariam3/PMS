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

const LoanAccountMappingList = () => {
  const tableRef = useRef();
  const { user } = useContext(AuthContext);

  const isMappingOpen = process.env.REACT_APP_IS_MAPPING_OPEN !== 'false';

  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [mapping, setMapping] = useState({
    loan_account_number: "",
    account_holder: "",
    collected_balance: 0,
    outstanding_balance: 0,
    status: "",
    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",
    district: "",
    branch: "",
    customer_id: "",
    crm_name: "",
  });

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchMappings = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
      team: user.team || null,
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${baseUrl}/loanaccountmapping/getLoanAccountMappingsByUser`,
        requestData,
      );
      setMappings(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch loan account mappings");
    } finally {
      setLoading(false);
    }
  };

  const validateLoanAccount = async () => {
    if (!mapping.loan_account_number) {
      toast.error("Please enter a loan account number first");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/cbs/loan-detail`, {
        loanaccountnumber: mapping.loan_account_number,
      });

      const data = res.data.data;
      setMapping((prev) => ({
        ...prev,
        account_holder: data.customerName,
        collected_balance: 0,
        outstanding_balance: parseFloat(String(data.outstandingBalance).replace(/,/g, "")) || 0,
        status: data.status,
        customer_id: data.customer,
        crm_name: user?.FullName || "",
        // branch: data.branch || "",
      }));

      setIsDisabled(true);

      if (data.companycode) {
        try {
          const branchRes = await axios.get(`${baseUrl}/branches/getBranchByCode/${data.companycode}`);
          setMapping((prev) => ({
            ...prev,
            district: branchRes.data.process_name || "",
            branch: branchRes.data.branch_name || "",
          }));
        } catch (e) {
          console.error(e);
        }
      }
      toast.success("Loan account validated");
    } catch (error) {
      toast.error("Validation failed");
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
      return () => { table.destroy(); };
    }
  }, [mappings]);

  const handleShow = () => {
    if (!isMappingOpen) {
      toast.error("Account mapping is currently closed.");
      return;
    }
    setMapping({
      loan_account_number: "",
      account_holder: "",
      collected_balance: 0,
      outstanding_balance: 0,
      status: "",
      user_name: user?.UserName || "",
      process: user?.process || "",
      subprocess: user?.subprocess || "",
      team: user?.team || "",
      district: "",
      branch: "",
      customer_id: "",
      crm_name: "",
    });
    setIsDisabled(false);
    setShowForm(true);
  };

  const handleClose = () => setShowForm(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (mapping.map_id) {
        await axios.put(`${baseUrl}/loanaccountmapping/${mapping.map_id}`, mapping);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${baseUrl}/loanaccountmapping`, mapping);
        toast.success("Added successfully");
      }
      fetchMappings();
      handleClose();
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setMapping(m);
    setIsDisabled(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/loanaccountmapping/${id}`);
      toast.success("Deleted successfully");
      fetchMappings();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{ "loan_account_number": "12345678" }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Loans");
    XLSX.writeFile(workbook, "loan_mapping_template.xlsx");
  };

  const handleUpload = async () => {
    if (!isMappingOpen) {
      toast.error("Account mapping is currently closed.");
      return;
    }
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_name", user?.UserName);
    formData.append("process", user?.process || "");
    formData.append("subprocess", user?.subprocess || "");
    formData.append("team", user?.team || "");

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/loanaccountmapping/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Import complete: ${res.data.summary.successCount} success`);
      fetchMappings();
      setSelectedFile(null);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>Loan Mappings</Typography>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">Dashboard</Link>
            <Typography color="text.primary">Loan OKR</Typography>
            <Typography color="text.primary">Mappings</Typography>
          </Breadcrumbs>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={handleDownloadTemplate}>Template</Button>
          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
            Select Excel
            <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => setSelectedFile(e.target.files[0])} />
          </Button>
          <Button variant="contained" onClick={handleUpload} disabled={!selectedFile} color="secondary">Upload</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleShow} color="info">Add Loan</Button>
        </Stack>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table ref={tableRef} className="display">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>Account Holder</TableCell>
                {/* <TableCell>Collected</TableCell> */}
                <TableCell>Outstanding</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>District</TableCell>
                <TableCell>Branch</TableCell>
                {/* <TableCell align="center">Actions</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.map_id} hover>
                  <TableCell>{m.map_id}</TableCell>
                  <TableCell>{m.loan_account_number}</TableCell>
                  <TableCell>{m.account_holder}</TableCell>
                  {/* <TableCell>{m.collected_balance?.toLocaleString()}</TableCell> */}
                  <TableCell>{m.outstanding_balance?.toLocaleString()}</TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell>{m.district}</TableCell>
                  <TableCell>{m.branch}</TableCell>
                  {/* <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton color="primary" onClick={() => handleEdit(m)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(m.map_id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Modal open={showForm} onClose={handleClose}>
        <Fade in={showForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>{mapping.map_id ? "Edit" : "Add"} Loan Mapping</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField fullWidth label="Loan Account Number" value={mapping.loan_account_number} onChange={(e) => setMapping({ ...mapping, loan_account_number: e.target.value })} disabled={isDisabled} required size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button variant="outlined" onClick={validateLoanAccount} disabled={loading || isDisabled} fullWidth>Validate</Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Account Holder" value={mapping.account_holder} InputProps={{ readOnly: true }} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Collected Balance" type="number" value={mapping.collected_balance} InputProps={{ readOnly: true }} onChange={(e) => setMapping({ ...mapping, collected_balance: e.target.value })} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Outstanding Balance" type="number" value={mapping.outstanding_balance} InputProps={{ readOnly: true }} onChange={(e) => setMapping({ ...mapping, outstanding_balance: e.target.value })} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="District" value={mapping.district} InputProps={{ readOnly: true }} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Branch" value={mapping.branch} InputProps={{ readOnly: true }} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Status" value={mapping.status} InputProps={{ readOnly: true }} size="small" />
                </Grid>

              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">{mapping.map_id ? "Update" : "Save"}</Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      <Backdrop sx={{ color: "#fff", zIndex: 1400 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default LoanAccountMappingList;
