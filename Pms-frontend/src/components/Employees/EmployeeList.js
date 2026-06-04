import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
  TextField,
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  TableContainer,
} from "@mui/material";

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";

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

const EmployeeList = () => {
  const tableRef = useRef();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");


  const [employeeForm, setEmployeeForm] = useState({
    employee_id: "",
    display_name: "",
    gender: "",
    dob: "",
    supervisor: "",
    manager_id: "",
    process_name: "",
    sub_process_name: "",
    branch_name: "",
    title: "",
    job_level: "",
    company_entry_date: "",
    position_entry_date: "",
    base_salary: "",
    pay_grade: "",
    pay_scale_level: "",
    location: "",
    business_phone_number: "",
    outlook_address: "",
    business_email_address: "",
    branch_grade: "",
    organization_unit: "",
  });



  const [processes, setProcesses] = useState([]);
  const [subProcesses, setSubProcesses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [titles, setTitles] = useState([]);
  const [jobLevels, setJobLevels] = useState([]);
  const [payGrades, setPayGrades] = useState([]);
  const [errors, setErrors] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchDropdowns = async () => {
    try {
      const [
        processRes,
        subProcessRes,
        branchRes,
        titleRes,
        jobLevelRes,
        payGradeRes,
      ] = await Promise.all([
        axios.get(`${baseUrl}/processes`),
        axios.get(`${baseUrl}/subProcess`),
        axios.get(`${baseUrl}/branches`),
        axios.get(`${baseUrl}/titles`),
        axios.get(`${baseUrl}/job-levels`),
        axios.get(`${baseUrl}/pay-grades`),
      ]);

      setProcesses(processRes.data);
      setSubProcesses(subProcessRes.data);
      setBranches(branchRes.data);
      setTitles(titleRes.data);
      setJobLevels(jobLevelRes.data);
      setPayGrades(payGradeRes.data);
    } catch (error) {
      console.error("Error fetching dropdown data", error);
      toast.error("Failed to load dropdown data");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setEmployees([]);
      setTableKey((prev) => prev + 1);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/employees/search?q=${searchQuery}`);
      setEmployees(res.data.employees);
      setTableKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to search employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (searchQuery) {
      handleSearch();
    } else {
      setEmployees([]);
      setTableKey((prev) => prev + 1);
    }
  };


  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
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
  }, [employees]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm({ ...employeeForm, [name]: value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!employeeForm.employee_id) newErrors.employee_id = "Employee ID is required";
    if (!employeeForm.display_name) newErrors.display_name = "Display Name is required";
    if (!employeeForm.gender) newErrors.gender = "Gender is required";
    if (!employeeForm.branch_name) newErrors.branch_name = "Branch is required";
    if (!employeeForm.title) newErrors.title = "Title is required";
    if (!employeeForm.outlook_address) {
      newErrors.outlook_address = "Outlook Address is required";
    }
    if (!employeeForm.business_email_address) {
      newErrors.business_email_address = "Business Email is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing) {
        await axios.put(`${baseUrl}/employees/${employeeForm.employee_id}`, employeeForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Employee updated successfully");
      } else {
        await axios.post(`${baseUrl}/employees/createEmployee`, employeeForm, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        toast.success("Employee added successfully");
      }
      setShowAddModal(false);
      setIsEditing(false);
      fetchEmployees();
    } catch (err) {
      console.error("Submission Error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || `Failed to ${isEditing ? "update" : "add"} employee`;
      toast.error(errorMsg);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${baseUrl}/employees/template`, {
        responseType: "blob",
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employee_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded successfully");
    } catch (err) {
      console.error("Error downloading template:", err);
      toast.error("Failed to download template");
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/employees/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });
      toast.success(res.data.message || "Employees uploaded successfully!");
      fetchEmployees();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await axios.delete(`${baseUrl}/employees/${id}`);
      toast.success("Employee deleted");
      fetchEmployees();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleShowDetails = (emp) => {
    setSelectedEmployee(emp);
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setEmployeeForm({
      employee_id: emp.employee_id || "",
      display_name: emp.display_name || "",
      gender: emp.gender || "",
      dob: emp.dob ? emp.dob.split("T")[0] : "",
      supervisor: emp.supervisor || "",
      manager_id: emp.manager_id || "",
      process_name: emp.process_name || "",
      sub_process_name: emp.sub_process_name || "",
      branch_name: emp.branch_name || "",
      title: emp.title || "",
      job_level: emp.job_level || "",
      company_entry_date: emp.company_entry_date ? emp.company_entry_date.split("T")[0] : "",
      position_entry_date: emp.position_entry_date ? emp.position_entry_date.split("T")[0] : "",
      base_salary: emp.base_salary || "",
      pay_grade: emp.pay_grade || "",
      pay_scale_level: emp.pay_scale_level || "",
      location: emp.location || "",
      business_phone_number: emp.business_phone_number || "",
      outlook_address: emp.outlook_address || "",
      business_email_address: emp.business_email_address || "",
      branch_grade: emp.branch_grade || "",
      organization_unit: emp.organization_unit || "",
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEmployeeForm({
      employee_id: "",
      display_name: "",
      gender: "",
      dob: "",
      supervisor: "",
      manager_id: "",
      process_name: "",
      sub_process_name: "",
      branch_name: "",
      title: "",
      job_level: "",
      company_entry_date: "",
      position_entry_date: "",
      base_salary: "",
      pay_grade: "",
      pay_scale_level: "",
      location: "",
      business_phone_number: "",
      outlook_address: "",
      business_email_address: "",
      branch_grade: "",
      organization_unit: "",
    });
    setErrors({});
    setIsEditing(false);
    setShowAddModal(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Employees
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>

            <Typography color="text.primary">Employees</Typography>
          </Breadcrumbs>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            onClick={handleDownloadTemplate}
            sx={{ textTransform: "none" }}
          >
            Download Template
          </Button>
          <Box component="form" onSubmit={handleUpload} sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ textTransform: "none" }}
            >
              Select File
              <input type="file" name="file" accept=".xlsx,.xls" hidden required />
            </Button>
            <Button type="submit" variant="contained" color="secondary" sx={{ textTransform: "none" }}>
              Upload
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            color="info"
            sx={{ textTransform: "none" }}
          >
            Add Employee
          </Button>
        </Stack>

      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <TextField
            placeholder="Search employees..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ width: { xs: "100%", sm: 300 } }}
          />
          <Button variant="contained" onClick={handleSearch} color="primary" size="small">
            Search
          </Button>
        </Box>
        <TableContainer key={tableKey} sx={{ maxHeight: "calc(100vh - 250px)", p: 2 }}>
          <table
            ref={tableRef}
            className="table table-striped table-hover display"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >

            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>ID</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Title</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Branch</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Supervisor</th>
                <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, index) => (
                <tr key={`${e.employee_id}-${index}`}>

                  <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{e.employee_id}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{e.display_name}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{e.title}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{e.branch_name}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{e.supervisor}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Details">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handleShowDetails(e)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEdit(e)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(e.employee_id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </Paper>

      {/* Details Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Employee Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedEmployee && (
              <Grid container spacing={2}>
                {Object.entries(selectedEmployee).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                      {key.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {String(value || "-")}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showAddModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {isEditing ? "Edit Employee" : "Add New Employee"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Employee ID" name="employee_id" type="number" value={employeeForm.employee_id} onChange={handleFormChange} error={!!errors.employee_id} helperText={errors.employee_id} required disabled={isEditing} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Display Name" name="display_name" value={employeeForm.display_name} onChange={handleFormChange} error={!!errors.display_name} helperText={errors.display_name} required />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ width: "300px" }}>
                  <FormControl fullWidth required error={!!errors.gender}>
                    <InputLabel>Gender</InputLabel>
                    <Select name="gender" value={employeeForm.gender} onChange={handleFormChange} label="Gender">
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date of Birth" name="dob" type="date" InputLabelProps={{ shrink: true }} value={employeeForm.dob} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Supervisor" name="supervisor" value={employeeForm.supervisor} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Manager ID" name="manager_id" value={employeeForm.manager_id} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Process Name</InputLabel>
                    <Select name="process_name" value={employeeForm.process_name} onChange={handleFormChange} label="Process Name">
                      {processes.map((p) => <MenuItem key={p.id} value={p.process_name}>{p.process_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Sub Process Name</InputLabel>
                    <Select name="sub_process_name" value={employeeForm.sub_process_name} onChange={handleFormChange} label="Sub Process Name">
                      {subProcesses.map((sp) => <MenuItem key={sp.id} value={sp.sub_process_name}>{sp.sub_process_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Branch Name</InputLabel>
                    <Select name="branch_name" value={employeeForm.branch_name} onChange={handleFormChange} label="Branch Name">
                      {branches.map((b) => <MenuItem key={b.id} value={b.branch_name}>{b.branch_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Title</InputLabel>
                    <Select name="title" value={employeeForm.title} onChange={handleFormChange} label="Title">
                      {titles.map((t) => <MenuItem key={t.id} value={t.title_name}>{t.title_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Job Level</InputLabel>
                    <Select name="job_level" value={employeeForm.job_level} onChange={handleFormChange} label="Job Level">
                      {jobLevels.map((jl) => <MenuItem key={jl.id} value={jl.job_level}>{jl.job_level}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Base Salary" name="base_salary" type="number" value={employeeForm.base_salary} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Pay Grade</InputLabel>
                    <Select name="pay_grade" value={employeeForm.pay_grade} onChange={handleFormChange} label="Pay Grade">
                      {payGrades.map((pg) => <MenuItem key={pg.id} value={pg.pay_grade}>{pg.pay_grade}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ width: "300px" }}>
                    <InputLabel>Pay Scale Level</InputLabel>
                    <Select name="pay_scale_level" value={employeeForm.pay_scale_level} onChange={handleFormChange} label="Pay Scale Level">
                      {payGrades.map((pg) => <MenuItem key={pg.id} value={pg.pay_scale_level}>{pg.pay_scale_level}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Location" name="location" value={employeeForm.location} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Branch Grade" name="branch_grade" value={employeeForm.branch_grade} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Organization Unit" name="organization_unit" value={employeeForm.organization_unit} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Outlook Address" name="outlook_address" type="email" value={employeeForm.outlook_address} onChange={handleFormChange} error={!!errors.outlook_address} helperText={errors.outlook_address} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Business Email" name="business_email_address" type="email" value={employeeForm.business_email_address} onChange={handleFormChange} error={!!errors.business_email_address} helperText={errors.business_email_address} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Entry Date" name="company_entry_date" type="date" InputLabelProps={{ shrink: true }} value={employeeForm.company_entry_date} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Position Entry Date" name="position_entry_date" type="date" InputLabelProps={{ shrink: true }} value={employeeForm.position_entry_date} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Business Phone Number" name="business_phone_number" value={employeeForm.business_phone_number} onChange={handleFormChange} />
                </Grid>

              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">
                  {isEditing ? "Update Employee" : "Save Employee"}
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

export default EmployeeList;
