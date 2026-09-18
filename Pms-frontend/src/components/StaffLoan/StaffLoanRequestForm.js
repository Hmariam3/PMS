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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const StaffLoanRequestForm = ({ onSuccess, onCancel, existingRequest }) => {
  const { user } = useContext(AuthContext);
  const isEditMode = !!existingRequest;

  // Form state
  const [formData, setFormData] = useState({
    // Employee Information
    employee_id: "",
    full_name: "",
    branch_name: "",
    position_title: "",
    date_of_hire: "",
    length_of_service_years: "",
    phone_extension: "",
    date_of_request: new Date().toISOString().split("T")[0],

    // Loan Details
    loan_type: "",
    loan_amount_requested: "",
    loan_purpose: "",

    // Scoring Criteria
    service_tenure_band: "",
    service_tenure_score: 0,
    individual_performance_band: "",
    individual_performance_score: 0,
    team_performance_band: "",
    team_performance_score: 0,
    disciplinary_record_band: "",
    disciplinary_record_score: 0,

    // Declaration
    staff_declaration_confirmed: false,
  });

  const [loading, setLoading] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Load existing request data if editing
  useEffect(() => {
    if (existingRequest) {
      setFormData({
        employee_id: existingRequest.employee_id || "",
        full_name: existingRequest.full_name || "",
        branch_name: existingRequest.branch_name || "",
        position_title: existingRequest.position_title || "",
        date_of_hire: existingRequest.date_of_hire || "",
        length_of_service_years: existingRequest.length_of_service_years || "",
        phone_extension: existingRequest.phone_extension || "",
        date_of_request: existingRequest.date_of_request || "",
        loan_type: existingRequest.loan_type || "",
        loan_amount_requested: existingRequest.loan_amount_requested || "",
        loan_purpose: existingRequest.loan_purpose || "",
        service_tenure_band: existingRequest.service_tenure_band || "",
        service_tenure_score: existingRequest.service_tenure_score || 0,
        individual_performance_band: existingRequest.individual_performance_band || "",
        individual_performance_score: existingRequest.individual_performance_score || 0,
        team_performance_band: existingRequest.team_performance_band || "",
        team_performance_score: existingRequest.team_performance_score || 0,
        disciplinary_record_band: existingRequest.disciplinary_record_band || "",
        disciplinary_record_score: existingRequest.disciplinary_record_score || 0,
        staff_declaration_confirmed: existingRequest.staff_declaration_confirmed || false,
      });
    }
  }, [existingRequest]);

  // Fetch employee information if user is logged in
  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      if (user && user.email && !isEditMode) {
        try {
          const response = await axios.get(`${API_URL}/employees/title/email`, {
            params: { email: user.email },
          });
          if (response.data) {
            const emp = response.data;
            setEmployeeInfo(emp);
            setFormData((prev) => ({
              ...prev,
              employee_id: emp.employee_id || "",
              full_name: emp.display_name || "",
              branch_name: emp.branch_name || "",
              position_title: emp.title || "",
              date_of_hire: emp.company_entry_date || "",
              phone_extension: emp.phone || "",
            }));

            // Calculate length of service
            if (emp.company_entry_date) {
              const hireDate = new Date(emp.company_entry_date);
              const today = new Date();
              const years = (today - hireDate) / (365.25 * 24 * 60 * 60 * 1000);
              setFormData((prev) => ({
                ...prev,
                length_of_service_years: years.toFixed(2),
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching employee info:", error);
        }
      }
    };

    fetchEmployeeInfo();
  }, [user, isEditMode]);

  // Scoring criteria mappings
  const serviceTenureBands = [
    { label: "10 years and above", value: "10+ years", score: 20 },
    { label: "6 – under 10 years", value: "6-10 years", score: 15 },
    { label: "3 – under 6 years", value: "3-6 years", score: 10 },
    { label: "1 – under 3 years", value: "1-3 years", score: 5 },
    { label: "Less than 1 year", value: "<1 year", score: 0 },
  ];

  const individualPerformanceBands = [
    { label: ">120% (Outstanding)", value: ">120%", score: 50 },
    { label: "100 – 119.99% (Very Good / Meets Expectations)", value: "100-119.99%", score: 40 },
    { label: "75 – 99.99% (Satisfactory)", value: "75-99.99%", score: 30 },
    { label: "50 – 74.99% (Good)", value: "50-74.99%", score: 20 },
    { label: "0 – 50% (Below Expectations)", value: "0-50%", score: 10 },
    { label: "Under June (not yet rated)", value: "Not rated", score: 0 },
  ];

  const teamPerformanceBands = [
    { label: ">120% (Outstanding)", value: ">120%", score: 20 },
    { label: "100 – 119.99% (Very Good / Meets Expectations)", value: "100-119.99%", score: 16 },
    { label: "75 – 99.99% (Satisfactory)", value: "75-99.99%", score: 12 },
    { label: "50 – 74.99% (Good)", value: "50-74.99%", score: 8 },
    { label: "0 – 50% (Below Expectations)", value: "0-50%", score: 4 },
    { label: "Under June (not yet rated)", value: "Not rated", score: 0 },
  ];

  const disciplinaryRecordBands = [
    { label: "Clean record — no sanctions in the last 24 months", value: "Clean record", score: 10 },
    { label: "Minor sanction in the last 24 months", value: "Minor sanction", score: 10 },
    { label: "Major / active sanction", value: "Major/active sanction", score: 0 },
  ];

  // Calculate total score
  const calculateTotalScore = () => {
    return (
      formData.service_tenure_score +
      formData.individual_performance_score +
      formData.team_performance_score +
      formData.disciplinary_record_score
    );
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle scoring criteria selection
  const handleScoringChange = (criteriaName, band, score) => {
    setFormData((prev) => ({
      ...prev,
      [`${criteriaName}_band`]: band,
      [`${criteriaName}_score`]: score,
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.employee_id || !formData.full_name || !formData.branch_name) {
      toast.error("Please fill in all employee information");
      return false;
    }

    if (!formData.loan_type || !formData.loan_amount_requested) {
      toast.error("Please fill in loan type and amount");
      return false;
    }

    if (!formData.service_tenure_band || !formData.individual_performance_band ||
        !formData.team_performance_band || !formData.disciplinary_record_band) {
      toast.error("Please complete all scoring criteria");
      return false;
    }

    if (!formData.staff_declaration_confirmed) {
      toast.error("Please confirm the staff declaration");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        created_by: user?.email || "system",
        updated_by: user?.email || "system",
      };

      let response;
      if (isEditMode) {
        response = await axios.put(
          `${API_URL}/staff-loan-requests/${existingRequest.id}`,
          payload
        );
        toast.success("Loan request updated successfully");
      } else {
        response = await axios.post(`${API_URL}/staff-loan-requests`, payload);
        toast.success("Loan request submitted successfully");
      }

      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (error) {
      console.error("Error submitting loan request:", error);
      toast.error(
        error.response?.data?.error || "Failed to submit loan request"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalScore = calculateTotalScore();

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          STAFF LOAN REQUEST FORM
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
          Branch Staff — Self-Assessment Against Loan Scoring Criteria
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Loan Type Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" required>
            <FormLabel component="legend" sx={{ fontWeight: "bold", mb: 1 }}>
              Loan Type Requested (tick one)
            </FormLabel>
            <RadioGroup
              name="loan_type"
              value={formData.loan_type}
              onChange={handleInputChange}
            >
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
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Employee Information */}
        <Typography variant="h6" gutterBottom color="primary">
          Employee Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled={!!employeeInfo}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Employee ID"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleInputChange}
              disabled={!!employeeInfo}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Branch Name"
              name="branch_name"
              value={formData.branch_name}
              onChange={handleInputChange}
              disabled={!!employeeInfo}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Position / Job Title"
              name="position_title"
              value={formData.position_title}
              onChange={handleInputChange}
              disabled={!!employeeInfo}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Date of Hire"
              name="date_of_hire"
              value={formData.date_of_hire}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              disabled={!!employeeInfo}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Length of Service (years)"
              name="length_of_service_years"
              value={formData.length_of_service_years}
              onChange={handleInputChange}
              type="number"
              InputProps={{ inputProps: { step: 0.01 } }}
              disabled={!!employeeInfo}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone / Extension"
              name="phone_extension"
              value={formData.phone_extension}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Date of Request"
              name="date_of_request"
              value={formData.date_of_request}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Loan Amount Requested"
              name="loan_amount_requested"
              value={formData.loan_amount_requested}
              onChange={handleInputChange}
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Purpose of Loan"
              name="loan_purpose"
              value={formData.loan_purpose}
              onChange={handleInputChange}
              multiline
              rows={1}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Self-Assessment Scoring Criteria */}
        <Typography variant="h6" gutterBottom color="primary">
          Self-Assessment: Loan Scoring Criteria (Branch Staff)
        </Typography>

        {/* Criterion 1: Length of Service */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              1. Length of Continuous Service (Tenure) - Weight: 0-20 points
            </Typography>
            <FormControl component="fieldset" required fullWidth>
              <RadioGroup
                value={formData.service_tenure_band}
                onChange={(e) => {
                  const selected = serviceTenureBands.find(
                    (b) => b.value === e.target.value
                  );
                  handleScoringChange("service_tenure", selected.value, selected.score);
                }}
              >
                {serviceTenureBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Score Claimed: <strong>{formData.service_tenure_score} points</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Criterion 2: Individual Performance */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              2. Individual Performance Result (Quarter — Branch staff) - Weight: 0-50 points
            </Typography>
            <FormControl component="fieldset" required fullWidth>
              <RadioGroup
                value={formData.individual_performance_band}
                onChange={(e) => {
                  const selected = individualPerformanceBands.find(
                    (b) => b.value === e.target.value
                  );
                  handleScoringChange(
                    "individual_performance",
                    selected.value,
                    selected.score
                  );
                }}
              >
                {individualPerformanceBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Score Claimed: <strong>{formData.individual_performance_score} points</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Criterion 3: Team Performance */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              3. Team Performance Result (Quarter — Branch staff) - Weight: 0-20 points
            </Typography>
            <FormControl component="fieldset" required fullWidth>
              <RadioGroup
                value={formData.team_performance_band}
                onChange={(e) => {
                  const selected = teamPerformanceBands.find(
                    (b) => b.value === e.target.value
                  );
                  handleScoringChange("team_performance", selected.value, selected.score);
                }}
              >
                {teamPerformanceBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Score Claimed: <strong>{formData.team_performance_score} points</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Criterion 6: Disciplinary Record */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              6. Disciplinary and Conduct Record - Weight: 0-10 points
            </Typography>
            <FormControl component="fieldset" required fullWidth>
              <RadioGroup
                value={formData.disciplinary_record_band}
                onChange={(e) => {
                  const selected = disciplinaryRecordBands.find(
                    (b) => b.value === e.target.value
                  );
                  handleScoringChange(
                    "disciplinary_record",
                    selected.value,
                    selected.score
                  );
                }}
              >
                {disciplinaryRecordBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Score Claimed: <strong>{formData.disciplinary_record_score} points</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Total Score Display */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: "primary.light" }}>
          <Typography variant="h5" align="center" color="white">
            TOTAL SCORE: <strong>{totalScore}</strong> / 100 points
          </Typography>
        </Paper>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Note:</strong> Criteria 4 (OKR performance) and 5 (Engagement result) apply only to District and Head Office staff. 
          Criterion 7 (Lottery method) applies only to Head Office staff. Branch staff are scored on criteria 1, 2, 3 and 6 above, 
          to a maximum of 100 points.
        </Alert>

        <Divider sx={{ my: 3 }} />

        {/* Staff Declaration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Staff Declaration
          </Typography>
          <Paper elevation={1} sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="body2" paragraph>
              I confirm that the information and self-assessment scores provided above are true and accurate 
              to the best of my knowledge. I understand that my declared scores are subject to verification by 
              my Branch Manager and Human Resources, and that any false declaration may affect my eligibility 
              for this loan and may be subject to disciplinary action.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  required
                  name="staff_declaration_confirmed"
                  checked={formData.staff_declaration_confirmed}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight="bold">
                  I confirm and agree to the above declaration
                </Typography>
              }
            />
          </Paper>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              size="large"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
          >
            {loading ? "Submitting..." : isEditMode ? "Update Request" : "Submit Request"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default StaffLoanRequestForm;
