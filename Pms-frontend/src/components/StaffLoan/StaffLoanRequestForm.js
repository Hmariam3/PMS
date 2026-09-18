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
  Chip,
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
    dob: "",
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

    // Scoring Criteria (auto-calculated, read-only except disciplinary)
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
  const [loadingScoring, setLoadingScoring] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [scoringDataLoaded, setScoringDataLoaded] = useState(false);

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

  // Fetch employee information and auto-calculated scoring data
  useEffect(() => {
    const fetchEmployeeScoringData = async () => {
      // user.MailAdress is the email property from login
      const userEmail = user?.MailAdress || user?.email;
      
      if (user && userEmail && !isEditMode) {
        setLoadingScoring(true);
        try {
          // First get employee info by email to get employee_id
          const empResponse = await axios.get(`${API_URL}/employees/title/email`, {
            params: { email: userEmail },
          });
          
          if (empResponse.data && empResponse.data.employee_id) {
            const employeeId = empResponse.data.employee_id;
            
            // Now fetch the auto-calculated scoring data
            const scoringResponse = await axios.get(
              `${API_URL}/staff-loan-requests/employee-scoring/${employeeId}`
            );
            
            if (scoringResponse.data.success) {
              const data = scoringResponse.data.data;
              
              // Set employee info
              setEmployeeInfo(data.employee_info);
              
              // Helper function to format date from ISO string to YYYY-MM-DD
              const formatDate = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              
              // Auto-populate form with employee info and calculated scores
              setFormData((prev) => ({
                ...prev,
                // Employee Information (read-only)
                employee_id: data.employee_info.employee_id || "",
                full_name: data.employee_info.full_name || "",
                dob: formatDate(data.employee_info.dob),
                branch_name: data.employee_info.branch_name || "",
                position_title: data.employee_info.position_title || "",
                date_of_hire: formatDate(data.employee_info.date_of_hire),
                length_of_service_years: data.employee_info.length_of_service_years || "",
                phone_extension: data.employee_info.phone_extension || "",
                
                // Auto-calculated scores (read-only)
                service_tenure_band: data.scoring.service_tenure.band || "",
                service_tenure_score: data.scoring.service_tenure.score || 0,
                individual_performance_band: data.scoring.individual_performance.band || "",
                individual_performance_score: data.scoring.individual_performance.score || 0,
                team_performance_band: data.scoring.team_performance.band || "",
                team_performance_score: data.scoring.team_performance.score || 0,
              }));
              
              setScoringDataLoaded(true);
            }
          }
        } catch (error) {
          console.error("Error fetching employee scoring data:", error);
          toast.error("Failed to load employee data. Please try again.");
        } finally {
          setLoadingScoring(false);
        }
      }
    };

    fetchEmployeeScoringData();
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

    if (!formData.disciplinary_record_band) {
      toast.error("Please select your disciplinary record status");
      return false;
    }

    if (!formData.staff_declaration_confirmed) {
      toast.error("Please confirm the staff declaration to proceed");
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
          Employee Information (Auto-Populated)
        </Typography>
        
        {loadingScoring && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading employee data and calculating scores...
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
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
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
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
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
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
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
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
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
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
              InputProps={{ 
                inputProps: { step: 0.01 },
                readOnly: !!employeeInfo,
              }}
              disabled={!!employeeInfo || loadingScoring}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone / Extension"
              name="phone_extension"
              value={formData.phone_extension}
              onChange={handleInputChange}
              disabled={!!employeeInfo || loadingScoring}
              InputProps={{
                readOnly: !!employeeInfo,
              }}
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
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* To Be Filled By You Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label="Required" color="error" size="small" />
            Loan Request Details (To Be Filled By You)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide the following information about your loan request:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
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
                helperText="Enter the loan amount you are requesting"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose of Loan"
                name="loan_purpose"
                value={formData.loan_purpose}
                onChange={handleInputChange}
                multiline
                rows={3}
                helperText="Describe the purpose of your loan request"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Self-Assessment Scoring Criteria */}
        <Typography variant="h6" gutterBottom color="primary">
          Self-Assessment: Loan Scoring Criteria (Branch Staff)
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Auto-Calculated Scores:</strong> The following scores have been automatically 
          calculated based on your employee records and performance data. Only the Disciplinary 
          Record section requires your input.
        </Alert>

        {/* Criterion 1: Length of Service - AUTO-CALCULATED */}
        <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              1. Length of Continuous Service (Tenure) - Weight: 0-20 points
              <Chip label="Auto-Calculated" color="success" size="small" sx={{ ml: 2 }} />
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This score has been automatically calculated based on your hire date 
              ({formData.date_of_hire ? new Date(formData.date_of_hire).toLocaleDateString() : 'N/A'}).
            </Alert>
            <FormControl component="fieldset" required fullWidth disabled>
              <RadioGroup value={formData.service_tenure_band}>
                {serviceTenureBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                    disabled
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: "success.light" }}>
              <Typography variant="body1" color="white" fontWeight="bold">
                Your Score: {formData.service_tenure_score} points 
                ({formData.length_of_service_years} years of service)
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Criterion 2: Individual Performance - AUTO-CALCULATED */}
        <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              2. Individual Performance Result (Quarter — Branch staff) - Weight: 0-50 points
              <Chip label="Auto-Calculated" color="success" size="small" sx={{ ml: 2 }} />
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This score has been automatically calculated based on your most recent quarterly 
              performance evaluation results.
            </Alert>
            <FormControl component="fieldset" required fullWidth disabled>
              <RadioGroup value={formData.individual_performance_band}>
                {individualPerformanceBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                    disabled
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: "success.light" }}>
              <Typography variant="body1" color="white" fontWeight="bold">
                Your Score: {formData.individual_performance_score} points
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Criterion 3: Team Performance - AUTO-CALCULATED */}
        <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              3. Team Performance Result (Quarter — Branch staff) - Weight: 0-20 points
              <Chip label="Auto-Calculated" color="success" size="small" sx={{ ml: 2 }} />
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This score has been automatically calculated based on your branch's most recent 
              performance results.
            </Alert>
            <FormControl component="fieldset" required fullWidth disabled>
              <RadioGroup value={formData.team_performance_band}>
                {teamPerformanceBands.map((band) => (
                  <FormControlLabel
                    key={band.value}
                    value={band.value}
                    control={<Radio />}
                    label={`${band.label} (${band.score} pts)`}
                    disabled
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: "success.light" }}>
              <Typography variant="body1" color="white" fontWeight="bold">
                Your Score: {formData.team_performance_score} points
              </Typography>
            </Paper>
          </CardContent>
        </Card>

        {/* Criterion 6: Disciplinary Record - USER INPUT REQUIRED */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              6. Disciplinary and Conduct Record - Weight: 0-10 points
              <Chip label="Your Input Required" color="warning" size="small" sx={{ ml: 2 }} />
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Please select the option that best describes your disciplinary record.</strong>
            </Alert>
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
          <Paper elevation={3} sx={{ p: 3, bgcolor: "warning.light", border: "2px solid", borderColor: "warning.main" }}>
            <Alert severity="warning" icon={false} sx={{ mb: 2 }}>
              <Typography variant="body1" paragraph fontWeight="bold">
                ⚠️ IMPORTANT DECLARATION
              </Typography>
              <Typography variant="body2" paragraph>
                I confirm that the information and self-assessment scores provided above are true and accurate 
                to the best of my knowledge. I understand that my declared scores are subject to verification by 
                my Branch Manager and Human Resources, and that any false declaration may affect my eligibility 
                for this loan and may be subject to disciplinary action.
              </Typography>
            </Alert>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  required
                  name="staff_declaration_confirmed"
                  checked={formData.staff_declaration_confirmed}
                  onChange={handleInputChange}
                  color="primary"
                  sx={{ 
                    '& .MuiSvgIcon-root': { fontSize: 28 }
                  }}
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
            disabled={loading || !formData.staff_declaration_confirmed}
            sx={{
              minWidth: 200,
              opacity: !formData.staff_declaration_confirmed ? 0.5 : 1,
            }}
          >
            {loading ? "Submitting..." : isEditMode ? "Update Request" : "Submit Request"}
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
