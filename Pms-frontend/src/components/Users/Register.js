import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Fade,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state;

  const [processes, setProcesses] = useState([]);
  const [subprocesses, setSubProcesses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    user_name: user?.UserName || "",
    full_name: user?.FullName || "",
    department: user?.departement || "",
    mail_address: user?.MailAdress || "",
    process: "",
    subprocess: "",
    team: "",
    title: "",
    position: "",
    role: "maker",
    organization: "",
    created_by: user?.FullName || "",
    cbs: "",
    company_code: "",
    cbsusername: "",
    departmentid: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const baseUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [procRes, subRes, branchRes, titleRes] = await Promise.all([
          axios.get(`${baseUrl}/processes`),
          axios.get(`${baseUrl}/subProcess`),
          axios.get(`${baseUrl}/branches`),
          axios.get(`${baseUrl}/titles`),
        ]);
        setProcesses(procRes.data);
        setSubProcesses(subRes.data);
        setTeams(branchRes.data);
        setTitles(titleRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load form data");
      } finally {
        setFetchingData(false);
      }
    };
    loadData();
  }, [baseUrl]);

  const fetchTitle = async (email) => {
    // const encodedEmail = encodeURIComponent(email);
    try {
      // const restitle = await axios.get(
      //   `${baseUrl}/employees/title/email/${encodedEmail}`,
      //   { timeout: 10000 }
      // );
      const restitle = await axios.get(
        `${baseUrl}/employees/title/email`,
        {
          params: { email },
          timeout: 10000,
        }
      );

      const data = restitle.data;
      setFormData((prev) => ({
        ...prev,
        title: data.title_name,
        title_id: data.title_id,
        organization: data.organization_unit,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employee title details");
    }
  };

  useEffect(() => {
    if (user?.MailAdress) {
      fetchTitle(user.MailAdress);
    }
  }, [user, baseUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "process") {
      setFormData({
        ...formData,
        process: value,
        subprocess: "",
        team: "",
      });
    } else if (name === "subprocess") {
      setFormData({
        ...formData,
        subprocess: value,
        team: "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateForm = () => {
    if (!formData.position) return "Position is required";
    if (["CEO", "VP", "CHF"].includes(formData.position)) {
      if (!formData.process) return "Process is required";
      if (!formData.organization) return "Organization is required";
    }
    if (["Director", "Senior Director"].includes(formData.position)) {
      if (!formData.process) return "Process is required";
      if (!formData.subprocess) return "Sub Process is required";
      if (!formData.organization) return "Organization is required";
    }
    if (["CRM", "Individual", "Manager"].includes(formData.position)) {
      if (!formData.process) return "Process is required";
      if (!formData.subprocess) return "Sub Process is required";
      if (!formData.team) return "Team/Branch is required";
      if (!formData.organization) return "Organization Unit is required";
    }
    if (formData.organization === "Branch" && !formData.company_code) return "Company Code is required";
    if (formData.organization === "Branch" && !formData.cbs) return "T24 User is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const errorMsg = validateForm();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setLoading(true);
    try {
      if (formData.organization === "Branch") {
        const validateRes = await axios.post(
          `${baseUrl}/branches/validate-code`,
          { team: formData.team, company_code: formData.company_code },
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REACT_APP_API_KEY,
            },
          }
        );
        if (!validateRes.data.valid) {
          setError("Company code does not match selected branch");
          setLoading(false);
          return;
        }
      }

      await axios.post(`${baseUrl}/users/createUser`, formData, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
      });

      setMessage("Profile created successfully! Redirecting...");
      toast.success("Registration complete");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async () => {
    if (!formData.cbs) {
      toast.warning("Please enter T24 User ID first");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/cbs/user-info`, {
        username: formData.cbs,
      });
      const data = res.data.data;
      setFormData((prev) => ({
        ...prev,
        company_code: data.company,
        cbsusername: data.id,
        departmentid: data.department,
      }));
      toast.success("User validated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to validate T24 user");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubProcesses = subprocesses.filter(
    (sp) => sp.process_name === formData.process
  );

  const filteredbranch = teams.filter(
    (br) => br.sub_proccess === formData.subprocess
  );

  if (fetchingData) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Fade in={true} timeout={500}>
        <Container maxWidth="md">
          <Paper
            elevation={12}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1, color: "#1e293b" }}>
              Complete Your Profile
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 4, color: "#64748b" }}>
              Please provide the following details to set up your account
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Username" name="user_name" value={formData.user_name} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Full Name" name="full_name" value={formData.full_name} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" name="mail_address" value={formData.mail_address} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Title" name="title" value={formData.title || ""} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Organization Unit" name="organization" value={formData.organization || ""} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>

                {formData.organization === "Branch" && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }}>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>T24 VALIDATION</Typography>
                      </Divider>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField fullWidth label="T24 User ID" name="cbs" value={formData.cbs} onChange={handleChange} />
                        <Button variant="outlined" onClick={getUserInfo} sx={{ whiteSpace: "nowrap" }}>Validate</Button>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Company Code" name="company_code" value={formData.company_code} InputProps={{ readOnly: true }} variant="filled" />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>WORK ASSIGNMENT</Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: 300 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Process</InputLabel>
                    <Select name="process" value={formData.process} onChange={handleChange} label="Process">
                      <MenuItem value=""><em>Select Process</em></MenuItem>
                      {processes.map((p) => (
                        <MenuItem key={p.proc_id} value={p.process_name}>{p.process_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: 300 }}>
                  <FormControl fullWidth disabled={!formData.process}>
                    <InputLabel>Sub Process</InputLabel>
                    <Select name="subprocess" value={formData.subprocess} onChange={handleChange} label="Sub Process">
                      <MenuItem value=""><em>Select Sub Process</em></MenuItem>
                      {filteredSubProcesses.map((sp) => (
                        <MenuItem key={sp.subprocess_id} value={sp.subprocess_name}>{sp.subprocess_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: 300 }}>
                  <FormControl fullWidth disabled={!formData.subprocess}>
                    <InputLabel>Team / Branch</InputLabel>
                    <Select name="team" value={formData.team} onChange={handleChange} label="Team / Branch">
                      <MenuItem value=""><em>Select Team / Branch</em></MenuItem>
                      {filteredbranch.map((t) => (
                        <MenuItem key={t.id} value={t.branch_name}>{t.branch_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: 300 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Position</InputLabel>
                    <Select name="position" value={formData.position} onChange={handleChange} label="Position">
                      <MenuItem value=""><em>Select Position</em></MenuItem>
                      <MenuItem value="CEO">CEO</MenuItem>
                      <MenuItem value="CHF">CHF</MenuItem>
                      <MenuItem value="VP">VP</MenuItem>
                      <MenuItem value="Senior Director">Senior Director</MenuItem>
                      <MenuItem value="Director">Director</MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                      <MenuItem value="CRM">CRM</MenuItem>
                      <MenuItem value="Individual">Individual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>



                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: "1rem",
                      fontWeight: 600,
                      textTransform: "none",
                      backgroundColor: "#1b3fcd",
                      "&:hover": { backgroundColor: "#1532a1" },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Registration"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Fade>
    </Box>
  );
};

export default Register;
