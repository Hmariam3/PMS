import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  Checkbox,
  Alert,
  Stack,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calcRetirement = (dobString) => {
  if (!dobString) return { age: "", date: "" };
  const dob = new Date(dobString);
  const today = new Date();
  const currentAge = Math.floor(
    (today - dob) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const yearsToRetirement = 60 - currentAge;
  const retDate = new Date(dob);
  retDate.setFullYear(retDate.getFullYear() + 60);
  return {
    age: `${currentAge} years (${yearsToRetirement} years to retirement)`,
    date: formatDate(retDate),
  };
};

// ─── scoring band definitions ────────────────────────────────────────────────

const SERVICE_BANDS = [
  { label: "10 years and above", value: "10+ years", score: 20 },
  { label: "6 – under 10 years", value: "6-10 years", score: 15 },
  { label: "3 – under 6 years", value: "3-6 years", score: 10 },
  { label: "1 – under 3 years", value: "1-3 years", score: 5 },
  { label: "Less than 1 year", value: "<1 year", score: 0 },
];

const INDIVIDUAL_BANDS = [
  { label: ">120% (Outstanding)", value: ">120%", score: 50 },
  { label: "100 – 119.99% (Very Good / Meets Expectations)", value: "100-119.99%", score: 40 },
  { label: "75 – 99.99% (Satisfactory)", value: "75-99.99%", score: 30 },
  { label: "50 – 74.99% (Good)", value: "50-74.99%", score: 20 },
  { label: "0 – 50% (Below Expectations)", value: "0-50%", score: 10 },
  { label: "Under June (not yet rated)", value: "Not rated", score: 0 },
];

const TEAM_BANDS = [
  { label: ">120% (Outstanding)", value: ">120%", score: 20 },
  { label: "100 – 119.99% (Very Good / Meets Expectations)", value: "100-119.99%", score: 16 },
  { label: "75 – 99.99% (Satisfactory)", value: "75-99.99%", score: 12 },
  { label: "50 – 74.99% (Good)", value: "50-74.99%", score: 8 },
  { label: "0 – 50% (Below Expectations)", value: "0-50%", score: 4 },
  { label: "Under June (not yet rated)", value: "Not rated", score: 0 },
];

const DISCIPLINARY_BANDS = [
  { label: "Clean record — no sanctions in the last 24 months", value: "Clean record", score: 10 },
  { label: "Minor sanction in the last 24 months", value: "Minor sanction", score: 10 },
  { label: "Major / active sanction", value: "Major/active sanction", score: 0 },
];

// ─── empty form state ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  // auto-populated employee info
  employee_id: "",
  full_name: "",
  dob: "",
  branch_name: "",
  position_title: "",
  date_of_hire: "",
  length_of_service_years: "",
  phone_extension: "",
  date_of_request: new Date().toISOString().split("T")[0],
  retirement_age: "",
  retirement_date: "",

  // filled by user
  loan_type: "",
  loan_amount_requested: "",
  loan_purpose: "",
  basic_salary: "",
  loan_application_count: "",

  // attachment
  attachment_file: null,
  attachment_file_name: "",

  // scoring (auto except disciplinary)
  service_tenure_band: "",
  service_tenure_score: 0,
  individual_performance_band: "",
  individual_performance_score: 0,
  team_performance_band: "",
  team_performance_score: 0,
  disciplinary_record_band: "",
  disciplinary_record_score: 0,

  // declaration
  staff_declaration_confirmed: false,
};

// ─── component ───────────────────────────────────────────────────────────────

const StaffLoanRequestForm = ({ onSuccess, onCancel, existingRequest }) => {
  const { user } = useContext(AuthContext);
  const isEditMode = !!existingRequest;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [loadingScoring, setLoadingScoring] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  const isEmergencyLoan = formData.loan_type === "Emergency Loan";

  // ── load existing request when editing ──────────────────────────────────
  useEffect(() => {
    if (existingRequest) {
      setFormData({
        ...EMPTY_FORM,
        employee_id: existingRequest.employee_id || "",
        full_name: existingRequest.full_name || "",
        dob: formatDate(existingRequest.dob) || "",
        branch_name: existingRequest.branch_name || "",
        position_title: existingRequest.position_title || "",
        date_of_hire: formatDate(existingRequest.date_of_hire) || "",
        length_of_service_years: existingRequest.length_of_service_years || "",
        phone_extension: existingRequest.phone_extension || "",
        date_of_request: formatDate(existingRequest.date_of_request) || EMPTY_FORM.date_of_request,
        loan_type: existingRequest.loan_type || "",
        loan_amount_requested: existingRequest.loan_amount_requested || "",
        loan_purpose: existingRequest.loan_purpose || "",
        basic_salary: existingRequest.basic_salary || "",
        loan_application_count: existingRequest.loan_application_count || "",
        service_tenure_band: existingRequest.service_tenure_band || "",
        service_tenure_score: existingRequest.service_tenure_score || 0,
        individual_performance_band: existingRequest.individual_performance_band || "",
        individual_performance_score: existingRequest.individual_performance_score || 0,
        team_performance_band: existingRequest.team_performance_band || "",
        team_performance_score: existingRequest.team_performance_score || 0,
        disciplinary_record_band: existingRequest.disciplinary_record_band || "",
        disciplinary_record_score: existingRequest.disciplinary_record_score || 0,
        staff_declaration_confirmed: existingRequest.staff_declaration_confirmed || false,
        attachment_file: null,
        attachment_file_name: "",
        retirement_age: "",
        retirement_date: "",
      });
    }
  }, [existingRequest]);

  // ── auto-fetch employee data ─────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;

    const userEmail = user?.MailAdress || user?.email;
    if (!userEmail) return;

    const fetchData = async () => {
      setLoadingScoring(true);
      try {
        const empRes = await axios.get(`${API_URL}/employees/title/email`, {
          params: { email: userEmail },
        });

        if (!empRes.data?.employee_id) return;

        const scoringRes = await axios.get(
          `${API_URL}/staff-loan-requests/employee-scoring/${empRes.data.employee_id}`
        );

        if (!scoringRes.data?.success) return;

        const d = scoringRes.data.data;
        setEmployeeInfo(d.employee_info);

        const ret = calcRetirement(d.employee_info.dob);

        setFormData((prev) => ({
          ...prev,
          employee_id: d.employee_info.employee_id || "",
          full_name: d.employee_info.full_name || "",
          dob: formatDate(d.employee_info.dob),
          branch_name: d.employee_info.branch_name || "",
          position_title: d.employee_info.position_title || "",
          date_of_hire: formatDate(d.employee_info.date_of_hire),
          length_of_service_years: d.employee_info.length_of_service_years || "",
          phone_extension: d.employee_info.phone_extension || "",
          retirement_age: ret.age,
          retirement_date: ret.date,
          service_tenure_band: d.scoring.service_tenure.band || "",
          service_tenure_score: d.scoring.service_tenure.score || 0,
          individual_performance_band: d.scoring.individual_performance.band || "",
          individual_performance_score: d.scoring.individual_performance.score || 0,
          team_performance_band: d.scoring.team_performance.band || "",
          team_performance_score: d.scoring.team_performance.score || 0,
        }));
      } catch (err) {
        console.error("Error fetching employee scoring data:", err);
        toast.error("Failed to load employee data. Please try again.");
      } finally {
        setLoadingScoring(false);
      }
    };

    fetchData();
  }, [user, isEditMode]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size must be less than 3MB");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      attachment_file: file,
      attachment_file_name: file.name,
    }));
  };

  const handleDisciplinaryChange = (e) => {
    const selected = DISCIPLINARY_BANDS.find((b) => b.value === e.target.value);
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      disciplinary_record_band: selected.value,
      disciplinary_record_score: selected.score,
    }));
  };

  const totalScore =
    formData.service_tenure_score +
    formData.individual_performance_score +
    formData.team_performance_score +
    formData.disciplinary_record_score;

  // ── validation ───────────────────────────────────────────────────────────
  const validate = () => {
    if (!formData.employee_id || !formData.full_name || !formData.branch_name) {
      toast.error("Employee information is missing");
      return false;
    }
    if (!formData.loan_type) {
      toast.error("Please select a loan type");
      return false;
    }
    if (!formData.loan_amount_requested) {
      toast.error("Please enter the loan amount");
      return false;
    }
    if (!formData.basic_salary) {
      toast.error("Please enter your basic salary");
      return false;
    }
    if (!formData.loan_application_count) {
      toast.error("Please select loan application count");
      return false;
    }
    if (!formData.attachment_file) {
      toast.error("Please attach required documents");
      return false;
    }
    if (!isEmergencyLoan && !formData.disciplinary_record_band) {
      toast.error("Please select your disciplinary record status");
      return false;
    }
    if (!formData.staff_declaration_confirmed) {
      toast.error("Please confirm the staff declaration");
      return false;
    }
    return true;
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Step 1 — create / update the loan request (JSON, no file)
      const payload = {
        ...formData,
        attachment_file: undefined,  // File object — not JSON-serialisable
        attachment_file_name: formData.attachment_file
          ? formData.attachment_file.name   // will be overwritten after upload
          : formData.attachment_file_name,
        created_by: user?.MailAdress || user?.email || "system",
        updated_by: user?.MailAdress || user?.email || "system",
      };

      let response;
      if (isEditMode) {
        response = await axios.put(
          `${API_URL}/staff-loan-requests/${existingRequest.id}`,
          payload
        );
      } else {
        response = await axios.post(`${API_URL}/staff-loan-requests`, payload);
      }

      const requestId = response.data.data.id;

      // Step 2 — upload the document (if a new file was selected)
      if (formData.attachment_file) {
        const fd = new FormData();
        fd.append("document", formData.attachment_file);
        fd.append("loan_type", formData.loan_type);
        fd.append("full_name", formData.full_name);
        fd.append("employee_id", formData.employee_id);

        try {
          await axios.post(
            `${API_URL}/staff-loan-requests/${requestId}/document`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } catch (uploadErr) {
          // If this is a new request, rollback creation so it's not saved without a document
          if (!isEditMode) {
            await axios.delete(`${API_URL}/staff-loan-requests/${requestId}`);
          }
          if (uploadErr.response && uploadErr.response.status === 413) {
            throw new Error("Failed to upload document because it's greater than 3 MB.");
          }
          throw new Error(uploadErr.response?.data?.error || "Failed to upload document.");
        }
      }

      toast.success(
        isEditMode ? "Loan request updated successfully" : "Loan request submitted successfully"
      );
      if (onSuccess) onSuccess(response.data.data);
    } catch (err) {
      console.error("Error submitting loan request:", err);
      toast.error(err.message || err.response?.data?.error || "Failed to submit loan request");
    } finally {
      setLoading(false);
    }
  };

  const readOnly = !!employeeInfo;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>

        {/* ── Title ── */}
        <Typography variant="h4" gutterBottom align="center" color="primary">
          STAFF LOAN REQUEST FORM
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
          Branch Staff — Self-Assessment Against Loan Scoring Criteria
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* ── Loan Type ── */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" required>
            <FormLabel component="legend" sx={{ fontWeight: "bold", mb: 1 }}>
              Loan Type Requested (tick one)
            </FormLabel>
            <RadioGroup name="loan_type" value={formData.loan_type} onChange={handleChange}>
              <FormControlLabel
                value="Personal Against Suretyship"
                control={<Radio />}
                label="Staff Personal Loan Against Suretyship"
              />
              <FormControlLabel
                value="Housing/Mortgage"
                control={<Radio />}
                label="Staff Housing / Mortgage Loan (incl. Incremental Staff Housing Loan and Personal Loan Against Collateral)"
              />
              <FormControlLabel
                value="Automobile"
                control={<Radio />}
                label="Staff Automobile Loan"
              />
              <FormControlLabel
                value="Emergency Loan"
                control={<Radio />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>Staff Emergency Loan</span>
                    <Chip label="No Scoring Required" color="success" size="small" />
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {isEmergencyLoan && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Emergency Loan:</strong> Available to all staff without scoring criteria.
              Simply fill in the loan details and attach the required documents.
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ── Employee Information (auto-populated) ── */}
        <Typography variant="h6" gutterBottom color="primary">
          Employee Information (Auto-Populated)
        </Typography>

        {loadingScoring && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading employee data and calculating scores…
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth required label="Full Name" name="full_name"
              value={formData.full_name} onChange={handleChange}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth required label="Employee ID" name="employee_id"
              value={formData.employee_id} onChange={handleChange}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth type="date" label="Date of Birth" name="dob"
              value={formData.dob} onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth required label="Branch Name" name="branch_name"
              value={formData.branch_name} onChange={handleChange}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth required label="Position / Job Title" name="position_title"
              value={formData.position_title} onChange={handleChange}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth required type="date" label="Date of Hire" name="date_of_hire"
              value={formData.date_of_hire} onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Length of Service (years)" name="length_of_service_years"
              value={formData.length_of_service_years} onChange={handleChange}
              type="number" InputProps={{ inputProps: { step: 0.01 }, readOnly }}
              disabled={readOnly || loadingScoring}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Phone / Extension" name="phone_extension"
              value={formData.phone_extension} onChange={handleChange}
              disabled={readOnly || loadingScoring}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth type="date" label="Date of Request" name="date_of_request"
              value={formData.date_of_request}
              InputLabelProps={{ shrink: true }}
              disabled
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* ── Loan Request Details (filled by user) ── */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6" gutterBottom color="primary"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Chip label="Required" color="error" size="small" />
            Loan Request Details (To Be Filled By You)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required
                label="Basic Salary (Monthly)" name="basic_salary"
                value={formData.basic_salary} onChange={handleChange}
                type="number"
                InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required
                label="Loan Amount Requested" name="loan_amount_requested"
                value={formData.loan_amount_requested} onChange={handleChange}
                type="number"
                InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}

              />
            </Grid>
            <Grid item xs={12} md={6} >
              <FormControl sx={{ width: "300px" }} required>
                <InputLabel>Loan Application Count</InputLabel>
                <Select
                  name="loan_application_count"
                  value={formData.loan_application_count}
                  onChange={handleChange}
                  label="Loan Application Count"
                >
                  <MenuItem value="First Time">First Time</MenuItem>
                  <MenuItem value="Second Time">Second Time</MenuItem>
                  <MenuItem value="Third Time">Third Time</MenuItem>
                  <MenuItem value="More than Three Times">More than Three Times</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Current Age / Retirement Age" name="retirement_age"
                value={formData.retirement_age}
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth type="date" label="Retirement Date" name="retirement_date"
                value={formData.retirement_date}
                InputLabelProps={{ shrink: true }}
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ width: "400px" }} multiline
                label="Purpose of Loan" name="loan_purpose"
                value={formData.loan_purpose} onChange={handleChange}
              />
            </Grid>

            {/* Document Attachment */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom>
                * Document Attachment (Required)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Accepted documents: PDF, DOC, DOCX, JPG, PNG. Max 3 MB.
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                Upload Documents
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
              {formData.attachment_file_name ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <strong>File attached:</strong> {formData.attachment_file_name}
                </Alert>
              ) : (
                <Alert severity="warning">
                  No file attached yet. Please upload required documents.
                </Alert>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* ── Scoring Criteria (hidden for Emergency Loan) ── */}
        {!isEmergencyLoan && (
          <Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom color="primary">
              Self-Assessment: Loan Scoring Criteria (Branch Staff)
            </Typography>

            {/* Criterion 1 */}
            <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  1. Length of Continuous Service (Tenure) — Weight: 0-20 pts
                  <Chip label="Auto-Calculated" color="success" size="small" sx={{ ml: 2 }} />
                </Typography>
                <FormControl component="fieldset" fullWidth disabled>
                  <RadioGroup value={formData.service_tenure_band}>
                    {SERVICE_BANDS.map((b) => (
                      <FormControlLabel
                        key={b.value} value={b.value}
                        control={<Radio />}
                        label={`${b.label} (${b.score} pts)`}
                        disabled
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Score: <strong>{formData.service_tenure_score} / 20 pts</strong>
                </Typography>
              </CardContent>
            </Card>

            {/* Criterion 2 */}
            <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  2. Individual Performance Result (Quarter) — Weight: 0-50 pts
                  <Chip label="Auto-Calculated" color="success" size="small" sx={{ ml: 2 }} />
                </Typography>
                <FormControl component="fieldset" fullWidth disabled>
                  <RadioGroup value={formData.individual_performance_band}>
                    {INDIVIDUAL_BANDS.map((b) => (
                      <FormControlLabel
                        key={b.value} value={b.value}
                        control={<Radio />}
                        label={`${b.label} (${b.score} pts)`}
                        disabled
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Score: <strong>{formData.individual_performance_score} / 50 pts</strong>
                </Typography>
              </CardContent>
            </Card>

            {/* Criterion 3 */}
            <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  3. Team Performance Result (Quarter) — Weight: 0-20 pts
                  <Chip label="Auto-Calculated" color="success" size="small" sx={{ ml: 2 }} />
                </Typography>
                <FormControl component="fieldset" fullWidth disabled>
                  <RadioGroup value={formData.team_performance_band}>
                    {TEAM_BANDS.map((b) => (
                      <FormControlLabel
                        key={b.value} value={b.value}
                        control={<Radio />}
                        label={`${b.label} (${b.score} pts)`}
                        disabled
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Score: <strong>{formData.team_performance_score} / 20 pts</strong>
                </Typography>
              </CardContent>
            </Card>

            {/* Criterion 6 — user fills */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  4. Disciplinary and Conduct Record — Weight: 0-10 pts
                  <Chip label="Your Input Required" color="warning" size="small" sx={{ ml: 2 }} />
                </Typography>
                {/* <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Please select the option that best describes your disciplinary record.</strong>
                </Alert> */}
                <FormControl component="fieldset" required fullWidth>
                  <RadioGroup
                    value={formData.disciplinary_record_band}
                    onChange={handleDisciplinaryChange}
                  >
                    {DISCIPLINARY_BANDS.map((b) => (
                      <FormControlLabel
                        key={b.value} value={b.value}
                        control={<Radio />}
                        label={`${b.label} (${b.score} pts)`}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Score: <strong>{formData.disciplinary_record_score} / 10 pts</strong>
                </Typography>
              </CardContent>
            </Card>

            {/* Total Score */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: "primary.light" }}>
              <Typography variant="h5" align="center" color="white">
                TOTAL SCORE: <strong>{totalScore}</strong> / 100 points
              </Typography>
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* ── Staff Declaration ── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Staff Declaration
          </Typography>
          <Paper
            elevation={3}
            sx={{ p: 3, bgcolor: "warning.light", border: "2px solid", borderColor: "warning.main" }}
          >
            <Alert severity="warning" icon={false} sx={{ mb: 2 }}>
              <Typography variant="body1" paragraph fontWeight="bold">
                ⚠️ IMPORTANT DECLARATION
              </Typography>
              <Typography variant="body2" paragraph>
                I confirm that the information and self-assessment scores provided above are true
                and accurate to the best of my knowledge. I understand that my declared scores are
                subject to verification by my Branch Manager and Human Resources, and that any
                false declaration may affect my eligibility for this loan and may be subject to
                disciplinary action.
              </Typography>
            </Alert>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  required
                  name="staff_declaration_confirmed"
                  checked={formData.staff_declaration_confirmed}
                  onChange={handleChange}
                  color="primary"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                />
              }
              label={
                <Typography variant="body1" fontWeight="bold" color="error">
                  * I confirm and agree to the above declaration (REQUIRED)
                </Typography>
              }
            />
            {!formData.staff_declaration_confirmed && (
              <Alert severity="error" sx={{ mt: 2 }}>
                You must agree to the declaration before submitting your loan request.
              </Alert>
            )}
          </Paper>
        </Box>

        {/* ── Action Buttons ── */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} size="large" disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || !formData.staff_declaration_confirmed}
            sx={{ minWidth: 200, opacity: formData.staff_declaration_confirmed ? 1 : 0.5 }}
          >
            {loading ? "Submitting…" : isEditMode ? "Update Request" : "Submit Request"}
          </Button>
        </Stack>

        {!formData.staff_declaration_confirmed && (
          <Typography variant="body2" color="error" align="center" sx={{ mt: 2 }}>
            Please check the declaration box to enable the submit button
          </Typography>
        )}

      </Paper>
    </Box>
  );
};

export default StaffLoanRequestForm;
