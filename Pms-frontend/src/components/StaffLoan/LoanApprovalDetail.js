import React, { useState, useContext, useEffect, useCallback } from "react";
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
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  ThumbUp as ApproveIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";
import { generateLoanPdf } from "./generateLoanPdf";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";
const fmtTs = (ts) => ts ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtMoney = (v) => v != null && v !== "" ? `ETB ${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—";

const InfoRow = ({ label, value }) => (
  <Grid item xs={12} md={6}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body1" fontWeight={500}>{value || "—"}</Typography>
  </Grid>
);

const Section = ({ title, children }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
    <Typography variant="h6" color="primary" gutterBottom>{title}</Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

// ─── Component ───────────────────────────────────────────────────────────────

const LoanApprovalDetail = ({ request: initialRequest, onClose, onApproved }) => {
  const { user } = useContext(AuthContext);

  const [request, setRequest] = useState(initialRequest);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [approverRemarks, setApproverRemarks] = useState("");

  const isApprover = (user?.title === "Employee Approver" || user?.title === "Enterprise System Operation and Application Developer");

  const refetch = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/staff-loan-requests/${initialRequest.id}`);
      if (res.data.success) setRequest(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [initialRequest.id]);

  useEffect(() => { refetch(); }, [refetch]);

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Loading…</Typography>
      </Box>
    );
  }

  const isEmergency = request.loan_type === "Emergency Loan";

  const otherDeductions = Array.isArray(request.deduction_other_items)
    ? request.deduction_other_items
    : (request.deduction_other_items ? JSON.parse(request.deduction_other_items) : []);

  const outstandingBalances = Array.isArray(request.outstanding_balances)
    ? request.outstanding_balances
    : (request.outstanding_balances ? JSON.parse(request.outstanding_balances) : []);

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/staff-loan-requests/${request.id}/approve`,
        {
          reviewer_title: user?.title,
          reviewer_email: user?.MailAdress || user?.email,
          approver_remarks: approverRemarks,
        }
      );
      toast.success("Loan request approved!");
      setRequest(res.data.data);
      setShowApprovePanel(false);
      if (onApproved) onApproved();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Loan Request #{request.id}
          </Typography>
          <Chip label={request.status} color="success" />
          {isEmergency && <Chip label="Emergency Loan" color="error" variant="outlined" />}
        </Box>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Close</Button>
      </Box>

      {/* Employee Information */}
      <Section title="Employee Information">
        <Grid container spacing={2}>
          <InfoRow label="Full Name" value={request.full_name} />
          <InfoRow label="Employee ID" value={request.employee_id} />
          <InfoRow label="Date of Birth" value={fmt(request.dob)} />
          <InfoRow label="Branch" value={request.branch_name} />
          <InfoRow label="Position / Title" value={request.position_title} />
          <InfoRow label="Date of Hire" value={fmt(request.date_of_hire)} />
          <InfoRow label="Length of Service" value={request.length_of_service_years ? `${request.length_of_service_years} yrs` : null} />
          <InfoRow label="Retirement Date" value={fmt(request.retirement_date)} />
        </Grid>
      </Section>

      {/* Loan Details */}
      <Section title="Loan Details">
        <Grid container spacing={2}>
          <InfoRow label="Loan Type" value={request.loan_type} />
          <InfoRow label="Amount Requested" value={fmtMoney(request.loan_amount_requested)} />
          <InfoRow label="Basic Salary" value={fmtMoney(request.basic_salary)} />
          <InfoRow label="Application Count" value={request.loan_application_count} />
          <InfoRow label="Purpose" value={request.loan_purpose} />
        </Grid>
      </Section>

      {/* Scoring */}
      {!isEmergency && (
        <Section title="Scoring Criteria">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell><strong>Criterion</strong></TableCell>
                  <TableCell align="center"><strong>Weight</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: "1. Length of Service", weight: "0–20", score: request.service_tenure_score },
                  { label: "2. Individual Performance", weight: "0–50", score: request.individual_performance_score },
                  { label: "3. Team Performance", weight: "0–20", score: request.team_performance_score },
                  { label: "6. Disciplinary Record", weight: "0–10", score: request.disciplinary_record_score },
                ].map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell align="center">{row.weight}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.score ?? 0} color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell><strong>Total Score</strong></TableCell>
                  <TableCell align="center"><strong>0–100</strong></TableCell>
                  <TableCell align="center">
                    <Chip label={`${request.total_score_claimed ?? 0} pts`} color="primary" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      )}

      {/* Deduction Summary */}
      {request.manager_verified && (
        <Section title="Salary & Deduction Summary">
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Basic Salary</TableCell>
                  <TableCell align="right"><strong>{fmtMoney(request.basic_salary)}</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Income Tax</TableCell>
                  <TableCell align="right">{fmtMoney(request.deduction_income_tax)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>7% Pension</TableCell>
                  <TableCell align="right">{fmtMoney(request.deduction_pension_7)}</TableCell>
                </TableRow>
                {otherDeductions.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.label}</TableCell>
                    <TableCell align="right">{fmtMoney(d.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Loan Repayment (this loan)</TableCell>
                  <TableCell align="right">{fmtMoney(request.deduction_amount)}</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "error.light" }}>
                  <TableCell><strong>Total Deduction</strong></TableCell>
                  <TableCell align="right"><strong>{fmtMoney(request.total_deduction)}</strong></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "success.light" }}>
                  <TableCell><strong>Net Salary After Deduction</strong></TableCell>
                  <TableCell align="right"><strong>{fmtMoney(request.net_salary_after_deduction)}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {outstandingBalances.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Outstanding Loan Balances</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableBody>
                    {outstandingBalances.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell>{b.label}</TableCell>
                        <TableCell align="right">{fmtMoney(b.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <Grid container spacing={2}>
            <InfoRow label="Repayment Period" value={request.deduction_months ? `${request.deduction_months} months` : null} />
            <InfoRow label="Manager Remarks" value={request.manager_remarks} />
          </Grid>
        </Section>
      )}

      {/* Checker summary */}
      {request.checker_verified && (
        <Section title="Checker Review Summary">
          <Grid container spacing={2}>
            <InfoRow label="Reviewed By" value={request.checker_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.checker_verified_at)} />
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Disciplinary Record</Typography>
              <Chip
                label={request.checker_disciplinary_verified ? "Clean ✓" : "Flagged ✗"}
                color={request.checker_disciplinary_verified ? "success" : "error"}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Loan Application Count</Typography>
              <Chip
                label={request.checker_loan_application_verified ? "Confirmed ✓" : "Discrepancy ✗"}
                color={request.checker_loan_application_verified ? "success" : "error"}
                size="small"
              />
            </Grid>
            <InfoRow label="Checker Remarks" value={request.checker_remarks} />
          </Grid>
        </Section>
      )}

      {/* Attached Document */}
      <Section title="Attached Document">
        {request.attachment_file_name ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <AttachFileIcon color="primary" />
            <Typography variant="body1" sx={{ flex: 1, wordBreak: "break-all" }}>
              {request.attachment_file_name}
            </Typography>
            <Button variant="outlined" startIcon={<VisibilityIcon />}
              onClick={() => window.open(`${API_URL}/staff-loan-requests/${request.id}/document`, "_blank")}>
              View
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />}
              onClick={() => {
                const a = document.createElement("a");
                a.href = `${API_URL}/staff-loan-requests/${request.id}/document`;
                a.setAttribute("download", request.attachment_file_name);
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}>
              Download
            </Button>
          </Stack>
        ) : (
          <Alert severity="warning">No document attached.</Alert>
        )}
      </Section>

      {/* Approve action */}
      {isApprover && request.status === "Recommended" && !showApprovePanel && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<ApproveIcon />}
            onClick={() => setShowApprovePanel(true)}
          >
            Give Final Approval
          </Button>
        </Box>
      )}

      {showApprovePanel && (
        <Paper elevation={3} sx={{ p: 3, mt: 2, border: "2px solid", borderColor: "success.main" }}>
          <Typography variant="h6" color="success.dark" gutterBottom>
            <ApproveIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Final Approval
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Alert severity="info" sx={{ mb: 2 }}>
            Once approved, the status will change to <strong>Approved</strong> and the employee
            will be able to download their official approval PDF.
          </Alert>
          <TextField
            fullWidth multiline rows={3}
            label="Approval Remarks (optional)"
            value={approverRemarks}
            onChange={(e) => setApproverRemarks(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => setShowApprovePanel(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained" color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? "Approving…" : "Confirm Approval"}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* PDF preview for already-approved */}
      {request.status === "Approved" && (
        <Section title="Approval Letter">
          <Alert severity="success" sx={{ mb: 2 }}>
            This request has been approved. The employee can download their official approval letter.
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => generateLoanPdf(request, "open")}
            >
              Preview PDF
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={() => generateLoanPdf(request, "download")}
            >
              Download Approval Letter
            </Button>
          </Stack>
        </Section>
      )}
    </Box>
  );
};

export default LoanApprovalDetail;
