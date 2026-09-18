import React, { useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const StaffLoanRequestDetail = ({ request, onClose, onRefresh }) => {
  const { user } = useContext(AuthContext);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewData, setReviewData] = useState({
    verified_service_score: request?.verified_service_score || "",
    verified_individual_performance_score: request?.verified_individual_performance_score || "",
    verified_team_performance_score: request?.verified_team_performance_score || "",
    verified_disciplinary_score: request?.verified_disciplinary_score || "",
    decision: request?.decision || "",
    reviewer_comments: request?.reviewer_comments || "",
  });

  if (!request) return null;

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

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateVerifiedTotal = () => {
    return (
      (parseInt(reviewData.verified_service_score) || 0) +
      (parseInt(reviewData.verified_individual_performance_score) || 0) +
      (parseInt(reviewData.verified_team_performance_score) || 0) +
      (parseInt(reviewData.verified_disciplinary_score) || 0)
    );
  };

  const handleSubmitReview = async () => {
    try {
      await axios.put(`${API_URL}/staff-loan-requests/${request.id}/review`, {
        ...reviewData,
        reviewed_by: user?.email || "system",
        updated_by: user?.email || "system",
      });
      toast.success("Review submitted successfully");
      setIsReviewing(false);
      if (onRefresh) onRefresh();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" color="primary">
          Staff Loan Request Details
        </Typography>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Request ID: #{request.id}</Typography>
              <Chip
                label={request.status}
                color={getStatusColor(request.status)}
                icon={
                  request.status === "Approved" || request.status === "Recommended" ? (
                    <CheckCircleIcon />
                  ) : request.status === "Rejected" || request.status === "Not Recommended" ? (
                    <CancelIcon />
                  ) : null
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Employee Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Employee Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Full Name
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.full_name}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Employee ID
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.employee_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Branch Name
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.branch_name}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Position / Job Title
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.position_title}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Date of Hire
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.date_of_hire ? new Date(request.date_of_hire).toLocaleDateString() : "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Length of Service
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.length_of_service_years} years
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Phone / Extension
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.phone_extension || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Date of Request
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.date_of_request
                ? new Date(request.date_of_request).toLocaleDateString()
                : "-"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Loan Details */}
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Loan Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Loan Type
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.loan_type}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Loan Amount Requested
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              ETB {parseFloat(request.loan_amount_requested).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Purpose of Loan
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.loan_purpose || "-"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Scoring Criteria */}
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Self-Assessment Scoring
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Criterion</strong>
                </TableCell>
                <TableCell>
                  <strong>Achievement Band</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Weight Range</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Score Claimed</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Verified Score</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>1. Length of Service</TableCell>
                <TableCell>{request.service_tenure_band}</TableCell>
                <TableCell align="center">0-20</TableCell>
                <TableCell align="center">
                  <Chip label={request.service_tenure_score} color="primary" size="small" />
                </TableCell>
                <TableCell align="center">
                  {request.verified_service_score !== null ? (
                    <Chip label={request.verified_service_score} color="success" size="small" />
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2. Individual Performance</TableCell>
                <TableCell>{request.individual_performance_band}</TableCell>
                <TableCell align="center">0-50</TableCell>
                <TableCell align="center">
                  <Chip
                    label={request.individual_performance_score}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {request.verified_individual_performance_score !== null ? (
                    <Chip
                      label={request.verified_individual_performance_score}
                      color="success"
                      size="small"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>3. Team Performance</TableCell>
                <TableCell>{request.team_performance_band}</TableCell>
                <TableCell align="center">0-20</TableCell>
                <TableCell align="center">
                  <Chip label={request.team_performance_score} color="primary" size="small" />
                </TableCell>
                <TableCell align="center">
                  {request.verified_team_performance_score !== null ? (
                    <Chip
                      label={request.verified_team_performance_score}
                      color="success"
                      size="small"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>6. Disciplinary Record</TableCell>
                <TableCell>{request.disciplinary_record_band}</TableCell>
                <TableCell align="center">0-10</TableCell>
                <TableCell align="center">
                  <Chip label={request.disciplinary_record_score} color="primary" size="small" />
                </TableCell>
                <TableCell align="center">
                  {request.verified_disciplinary_score !== null ? (
                    <Chip
                      label={request.verified_disciplinary_score}
                      color="success"
                      size="small"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell colSpan={2}>
                  <strong>TOTAL SCORE</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>0-100</strong>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${request.total_score_claimed} pts`}
                    color="primary"
                    size="medium"
                  />
                </TableCell>
                <TableCell align="center">
                  {request.verified_total_score !== null ? (
                    <Chip
                      label={`${request.verified_total_score} pts`}
                      color="success"
                      size="medium"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Staff Declaration */}
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Staff Declaration
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert
          severity={request.staff_declaration_confirmed ? "success" : "warning"}
          icon={request.staff_declaration_confirmed ? <CheckCircleIcon /> : <CancelIcon />}
        >
          <Typography variant="body2">
            <strong>Declaration Status:</strong>{" "}
            {request.staff_declaration_confirmed ? "Confirmed" : "Not Confirmed"}
          </Typography>
          {request.staff_signature_date && (
            <Typography variant="body2">
              <strong>Date:</strong>{" "}
              {new Date(request.staff_signature_date).toLocaleDateString()}
            </Typography>
          )}
        </Alert>
      </Paper>

      {/* Review Section (For Office Use) */}
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          For Official Use Only
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {!isReviewing && request.reviewed_by && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Reviewed By
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {request.reviewed_by}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Review Date
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {request.review_date ? new Date(request.review_date).toLocaleDateString() : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Decision
              </Typography>
              <Chip
                label={request.decision || "Pending"}
                color={request.decision === "Recommended" ? "success" : "error"}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Comments
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {request.reviewer_comments || "-"}
              </Typography>
            </Grid>
          </Grid>
        )}

        {!isReviewing && !request.reviewed_by && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsReviewing(true)}
          >
            Review & Verify Scores
          </Button>
        )}

        {isReviewing && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please verify the self-assessed scores and provide your decision.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Verified Service Score (0-20)"
                  name="verified_service_score"
                  value={reviewData.verified_service_score}
                  onChange={handleReviewChange}
                  inputProps={{ min: 0, max: 20 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Verified Individual Performance Score (0-50)"
                  name="verified_individual_performance_score"
                  value={reviewData.verified_individual_performance_score}
                  onChange={handleReviewChange}
                  inputProps={{ min: 0, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Verified Team Performance Score (0-20)"
                  name="verified_team_performance_score"
                  value={reviewData.verified_team_performance_score}
                  onChange={handleReviewChange}
                  inputProps={{ min: 0, max: 20 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Verified Disciplinary Score (0-10)"
                  name="verified_disciplinary_score"
                  value={reviewData.verified_disciplinary_score}
                  onChange={handleReviewChange}
                  inputProps={{ min: 0, max: 10 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: "primary.light" }}>
                  <Typography variant="h6" align="center" color="white">
                    Verified Total Score: {calculateVerifiedTotal()} / 100
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Decision</InputLabel>
                  <Select
                    name="decision"
                    value={reviewData.decision}
                    onChange={handleReviewChange}
                    label="Decision"
                  >
                    <MenuItem value="Recommended">Recommended</MenuItem>
                    <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reviewer Comments"
                  name="reviewer_comments"
                  value={reviewData.reviewer_comments}
                  onChange={handleReviewChange}
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => setIsReviewing(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default StaffLoanRequestDetail;
