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
  InputAdornment,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  HowToReg as ManagerIcon,
  FactCheck as CheckerIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (d) => d ? new Date(d).toLocaleDateString() : "—";
const fmtTs = (ts) => ts
  ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
  : "—";
const fmtMoney = (v) =>
  v != null && v !== "" ? `ETB ${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—";

const statusColor = (s) => ({
  Pending: "warning",
  "Manager Review": "info",
  "Checker Review": "info",
  Recommended: "success",
  "Not Recommended": "error",
  Approved: "success",
  Rejected: "error",
}[s] || "default");

// ─── small layout helpers ─────────────────────────────────────────────────────

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

const StepBadge = ({ label, done, by, at }) => (
  <Box sx={{ textAlign: "center", minWidth: 150 }}>
    <Chip label={label} color={done ? "success" : "default"}
      icon={done ? <CheckCircleIcon /> : undefined} size="small" />
    {done && by && (
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
        {by}
      </Typography>
    )}
    {done && at && (
      <Typography variant="caption" display="block" color="text.secondary">{at}</Typography>
    )}
  </Box>
);

// ─── empty manager form ───────────────────────────────────────────────────────

const emptyMgrForm = () => ({
  mgr_verified_service_score: 0,
  mgr_verified_individual_score: 0,
  mgr_verified_team_score: 0,
  // fixed deductions
  deduction_income_tax: "",
  deduction_pension_7: "",
  // loan repayment (this is the 'deduction_amount' column)
  deduction_amount: "",
  deduction_months: "",
  // dynamic extra deduction rows
  deduction_other_items: [],   // [{label, amount}]
  // outstanding balances
  outstanding_balances: [],    // [{label, amount}]
  manager_remarks: "",
});

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const StaffLoanRequestDetail = ({ request: initialRequest, onClose, onRefresh }) => {
  const { user } = useContext(AuthContext);

  const [request, setRequest] = useState(initialRequest);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'manager' | 'checker'

  const [mgrForm, setMgrForm] = useState(emptyMgrForm());
  const [chkForm, setChkForm] = useState({
    checker_disciplinary_verified: null,
    checker_loan_application_verified: null,
    checker_loan_application_remarks: "",
    checker_remarks: "",
  });

  // ── fetch full record on mount ──────────────────────────────────────────────
  const refetch = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/staff-loan-requests/${initialRequest.id}`);
      if (res.data.success) {
        const d = res.data.data;
        setRequest(d);
        // Populate manager form with existing values if already reviewed
        setMgrForm({
          mgr_verified_service_score: d.mgr_verified_service_score ?? d.service_tenure_score ?? 0,
          mgr_verified_individual_score: d.mgr_verified_individual_score ?? d.individual_performance_score ?? 0,
          mgr_verified_team_score: d.mgr_verified_team_score ?? d.team_performance_score ?? 0,
          deduction_income_tax: d.deduction_income_tax ?? "",
          deduction_pension_7: d.deduction_pension_7 ?? "",
          deduction_amount: d.deduction_amount ?? "",
          deduction_months: d.deduction_months ?? "",
          deduction_other_items:
            Array.isArray(d.deduction_other_items)
              ? d.deduction_other_items
              : (d.deduction_other_items ? JSON.parse(d.deduction_other_items) : []),
          outstanding_balances:
            Array.isArray(d.outstanding_balances)
              ? d.outstanding_balances
              : (d.outstanding_balances ? JSON.parse(d.outstanding_balances) : []),
          manager_remarks: d.manager_remarks ?? "",
        });
        setChkForm({
          checker_disciplinary_verified: d.checker_disciplinary_verified ?? null,
          checker_loan_application_verified: d.checker_loan_application_verified ?? null,
          checker_loan_application_remarks: d.checker_loan_application_remarks ?? "",
          checker_remarks: d.checker_remarks ?? "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch loan request:", err);
    } finally {
      setFetching(false);
    }
  }, [initialRequest.id]);

  useEffect(() => { refetch(); }, [refetch]);

  if (!request) return null;

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Loading…</Typography>
      </Box>
    );
  }

  const userTitle = user?.title || "";
  const isEmergency = request.loan_type === "Emergency Loan";
  const canManagerReview = (userTitle === "Enterprise System Operation and Application Developer" || userTitle === "Manager, Payroll Administrator") && request.checker_verified && !request.manager_verified;
  const canCheckerReview = (userTitle === "Enterprise System Operation and Application Developer" || userTitle === "Manager, Employee Services Management") && !request.checker_verified;

  // ── live deduction total ────────────────────────────────────────────────────
  const calcTotal = () => {
    const tax = parseFloat(mgrForm.deduction_income_tax) || 0;
    const pen = parseFloat(mgrForm.deduction_pension_7) || 0;
    const others = mgrForm.deduction_other_items.reduce(
      (s, i) => s + (parseFloat(i.amount) || 0), 0
    );
    return tax + pen + others;
  };

  const totalDeduction = calcTotal();
  const netSalary = (parseFloat(request.basic_salary) || 0) - totalDeduction;

  // ── manager form helpers ───────────────────────────────────────────────────
  const setMgr = (field, val) => setMgrForm(p => ({ ...p, [field]: val }));

  const addOtherItem = () =>
    setMgrForm(p => ({ ...p, deduction_other_items: [...p.deduction_other_items, { label: "", amount: "" }] }));

  const updateOtherItem = (idx, field, val) =>
    setMgrForm(p => {
      const items = [...p.deduction_other_items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...p, deduction_other_items: items };
    });

  const removeOtherItem = (idx) =>
    setMgrForm(p => ({
      ...p,
      deduction_other_items: p.deduction_other_items.filter((_, i) => i !== idx),
    }));

  const addBalance = () =>
    setMgrForm(p => ({ ...p, outstanding_balances: [...p.outstanding_balances, { label: "", amount: "" }] }));

  const updateBalance = (idx, field, val) =>
    setMgrForm(p => {
      const items = [...p.outstanding_balances];
      items[idx] = { ...items[idx], [field]: val };
      return { ...p, outstanding_balances: items };
    });

  const removeBalance = (idx) =>
    setMgrForm(p => ({
      ...p,
      outstanding_balances: p.outstanding_balances.filter((_, i) => i !== idx),
    }));

  // ── manager submit ──────────────────────────────────────────────────────────
  const submitManager = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/staff-loan-requests/${request.id}/manager-review`,
        {
          reviewer_title: "Manager, Payroll Administrator",
          reviewer_email: user?.MailAdress || user?.email,
          ...mgrForm,
        }
      );
      toast.success("Manager review submitted.");
      setRequest(res.data.data);
      setPanel(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit manager review.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── checker submit ──────────────────────────────────────────────────────────
  const submitChecker = async () => {
    if (chkForm.checker_disciplinary_verified === null) {
      toast.error("Please select a disciplinary verification decision.");
      return;
    }
    if (chkForm.checker_loan_application_verified === null) {
      toast.error("Please verify the loan application count.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/staff-loan-requests/${request.id}/checker-review`,
        {
          reviewer_title: "Manager, Employee Services Management",
          reviewer_email: user?.MailAdress || user?.email,
          ...chkForm,
        }
      );
      toast.success("Checker review submitted.");
      setRequest(res.data.data);
      setPanel(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit checker review.");
    } finally {
      setSubmitting(false);
    }
  };

  const mgrScoreTotal =
    (parseInt(mgrForm.mgr_verified_service_score) || 0) +
    (parseInt(mgrForm.mgr_verified_individual_score) || 0) +
    (parseInt(mgrForm.mgr_verified_team_score) || 0);

  // ── threshold helpers ───────────────────────────────────────────────────────
  const THRESHOLDS = {
    "Automobile": 100,
    "Housing/Mortgage": 85,
    "Personal Against Suretyship": 50,
    "Emergency Loan": 0,
  };

  const meetsThreshold = (loanType, score) => {
    if (loanType === "Emergency Loan") return true;
    const threshold = THRESHOLDS[loanType] ?? 100;
    return (score ?? 0) >= threshold;
  };

  const thresholdMessage = (loanType, score) => {
    if (loanType === "Emergency Loan")
      return "Emergency Loan — no score threshold applies.";
    const threshold = THRESHOLDS[loanType] ?? 100;
    const s = score ?? 0;
    const passes = s >= threshold;
    return passes
      ? `Score ${s} / 100 meets the threshold of ${threshold} for ${loanType}. → Will be Recommended.`
      : `Score ${s} / 100 is below the threshold of ${threshold} for ${loanType}. → Will be Not Recommended.`;
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Loan Request #{request.id}
          </Typography>
          <Chip label={request.status} color={statusColor(request.status)} />
          {isEmergency && <Chip label="Emergency Loan" color="error" variant="outlined" />}
        </Box>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Close</Button>
      </Box>

      {/* Workflow progress */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <StepBadge label="1. Submitted" done at={fmtTs(request.created_at)} by={request.created_by} />
          <Typography color="text.secondary">→</Typography>
          <StepBadge label="2. Checker Review" done={!!request.checker_verified}
            by={request.checker_verified_by} at={fmtTs(request.checker_verified_at)} />
          <Typography color="text.secondary">→</Typography>
          <StepBadge label="3. Manager Review" done={!!request.manager_verified}
            by={request.manager_verified_by} at={fmtTs(request.manager_verified_at)} />
        </Stack>
      </Paper>

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
          <InfoRow label="Phone / Extension" value={request.phone_extension} />
          <InfoRow label="Date of Request" value={fmt(request.date_of_request)} />
          <InfoRow label="Retirement Date" value={fmt(request.retirement_date)} />
        </Grid>
      </Section>

      {/* Loan Details */}
      <Section title="Loan Request Details">
        <Grid container spacing={2}>
          <InfoRow label="Loan Type" value={request.loan_type} />
          <InfoRow label="Loan Amount" value={fmtMoney(request.loan_amount_requested)} />
          <InfoRow label="Basic Salary" value={fmtMoney(request.basic_salary)} />
          <InfoRow label="Application Count" value={request.loan_application_count} />
          <InfoRow label="Purpose" value={request.loan_purpose} />
        </Grid>
      </Section>

      {/* Scoring — hidden for emergency loans */}
      {!isEmergency && (
        <Section title="Self-Assessment Scoring Criteria">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell><strong>Criterion</strong></TableCell>
                  <TableCell><strong>Band</strong></TableCell>
                  <TableCell align="center"><strong>Weight</strong></TableCell>
                  <TableCell align="center"><strong>Staff Score</strong></TableCell>
                  <TableCell align="center"><strong>Manager Verified</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  {
                    label: "1. Length of Service",
                    band: request.service_tenure_band,
                    weight: "0–20",
                    staff: request.service_tenure_score,
                    mgr: request.mgr_verified_service_score,
                  },
                  {
                    label: "2. Individual Performance",
                    band: request.individual_performance_band,
                    weight: "0–50",
                    staff: request.individual_performance_score,
                    mgr: request.mgr_verified_individual_score,
                  },
                  {
                    label: "3. Team Performance",
                    band: request.team_performance_band,
                    weight: "0–20",
                    staff: request.team_performance_score,
                    mgr: request.mgr_verified_team_score,
                  },
                ].map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.band || "—"}</TableCell>
                    <TableCell align="center">{row.weight}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.staff ?? 0} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      {request.manager_verified
                        ? <Chip label={row.mgr ?? 0} color="success" size="small" />
                        : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Disciplinary row */}
                <TableRow>
                  <TableCell>6. Disciplinary Record</TableCell>
                  <TableCell>{request.disciplinary_record_band || "—"}</TableCell>
                  <TableCell align="center">0–10</TableCell>
                  <TableCell align="center">
                    <Chip label={request.disciplinary_record_score ?? 0} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {request.checker_verified
                      ? <Chip
                        label={request.checker_disciplinary_verified ? "Verified ✓" : "Flagged ✗"}
                        color={request.checker_disciplinary_verified ? "success" : "error"}
                        size="small"
                      />
                      : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                  </TableCell>
                </TableRow>
                {/* Totals */}
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell colSpan={2}><strong>Total Score</strong></TableCell>
                  <TableCell align="center"><strong>0–100</strong></TableCell>
                  <TableCell align="center">
                    <Chip label={`${request.total_score_claimed ?? 0} pts`} color="primary" />
                  </TableCell>
                  <TableCell align="center">
                    {request.manager_verified
                      ? <Chip label={`${request.mgr_verified_total_score ?? 0} pts`} color="success" />
                      : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      )}

      {/* Manager deduction summary — shown after manager reviews */}
      {request.manager_verified && (
        <Section title="Manager Review — Salary & Deduction Summary">
          <Grid container spacing={2}>
            <InfoRow label="Reviewed By" value={request.manager_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.manager_verified_at)} />
          </Grid>
          <Divider sx={{ my: 2 }} />

          {/* Deduction breakdown table */}
          <Typography variant="subtitle2" gutterBottom>Deduction Breakdown</Typography>
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
                {(Array.isArray(request.deduction_other_items)
                  ? request.deduction_other_items
                  : (request.deduction_other_items ? JSON.parse(request.deduction_other_items) : [])
                ).map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell align="right">{fmtMoney(item.amount)}</TableCell>
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

          {/* Outstanding balances */}
          {(() => {
            const balances = Array.isArray(request.outstanding_balances)
              ? request.outstanding_balances
              : (request.outstanding_balances ? JSON.parse(request.outstanding_balances) : []);
            return balances.length > 0 ? (
              <>
                <Typography variant="subtitle2" gutterBottom>Outstanding Loan Balances</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableBody>
                      {balances.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell>{b.label}</TableCell>
                          <TableCell align="right">{fmtMoney(b.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : null;
          })()}

          <Grid container spacing={2}>
            <InfoRow label="Repayment Period" value={request.deduction_months ? `${request.deduction_months} months` : null} />
            <InfoRow label="Manager Remarks" value={request.manager_remarks} />
          </Grid>
        </Section>
      )}

      {/* Checker summary — shown after checker reviews */}
      {request.checker_verified && (
        <Section title="Checker Review — Disciplinary & Loan Count Verification">
          <Grid container spacing={2}>
            <InfoRow label="Verified By" value={request.checker_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.checker_verified_at)} />
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Disciplinary Record
              </Typography>
              <Chip
                label={request.checker_disciplinary_verified ? "Clean — Verified ✓" : "Issue Flagged ✗"}
                color={request.checker_disciplinary_verified ? "success" : "error"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Loan Application Count
              </Typography>
              <Chip
                label={request.checker_loan_application_verified ? "Confirmed ✓" : "Discrepancy Flagged ✗"}
                color={request.checker_loan_application_verified ? "success" : "error"}
              />
              {request.checker_loan_application_remarks && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  {request.checker_loan_application_remarks}
                </Typography>
              )}
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
            <Button
              variant="outlined" startIcon={<VisibilityIcon />}
              onClick={() => window.open(`${API_URL}/staff-loan-requests/${request.id}/document`, "_blank")}
            >
              View
            </Button>
            <Button
              variant="contained" startIcon={<DownloadIcon />}
              onClick={() => {
                const a = document.createElement("a");
                a.href = `${API_URL}/staff-loan-requests/${request.id}/document`;
                a.setAttribute("download", request.attachment_file_name);
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}
            >
              Download
            </Button>
          </Stack>
        ) : (
          <Alert severity="warning">No document attached to this request.</Alert>
        )}
      </Section>

      {/* Review action buttons */}
      {(canManagerReview || canCheckerReview) && panel === null && (
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          {canManagerReview && (
            <Button variant="contained" color="primary" startIcon={<ManagerIcon />}
              onClick={() => setPanel("manager")}>
              Manager Review & Verify
            </Button>
          )}
          {canCheckerReview && (
            <Button variant="contained" color="secondary" startIcon={<CheckerIcon />}
              onClick={() => setPanel("checker")}>
              Checker Review & Verify
            </Button>
          )}
        </Box>
      )}

      {/* ── Manager review panel ── */}
      {panel === "manager" && (
        <Paper elevation={3} sx={{ p: 3, mt: 2, border: "2px solid", borderColor: "primary.main" }}>
          <Typography variant="h6" color="primary" gutterBottom>
            <ManagerIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Manager, Payroll Administrator — Review & Verification
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* ── Score summary (read-only) ── */}
          {!isEmergency && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Scoring Summary (system-calculated, read-only)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.100" }}>
                      <TableCell><strong>Criterion</strong></TableCell>
                      <TableCell align="center"><strong>Weight</strong></TableCell>
                      <TableCell align="center"><strong>Score</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>1. Length of Service</TableCell>
                      <TableCell align="center">0–20</TableCell>
                      <TableCell align="center">
                        <Chip label={request.service_tenure_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2. Individual Performance</TableCell>
                      <TableCell align="center">0–50</TableCell>
                      <TableCell align="center">
                        <Chip label={request.individual_performance_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3. Team Performance</TableCell>
                      <TableCell align="center">0–20</TableCell>
                      <TableCell align="center">
                        <Chip label={request.team_performance_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        6. Disciplinary Record
                        <Chip label="Checker Verified ✓" color="success" size="small" sx={{ ml: 1 }} />
                      </TableCell>
                      <TableCell align="center">0–10</TableCell>
                      <TableCell align="center">
                        <Chip label={request.disciplinary_record_score ?? 0} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell><strong>Total Score</strong></TableCell>
                      <TableCell align="center"><strong>0–100</strong></TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${request.total_score_claimed ?? 0} pts`}
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Threshold indicator */}
              <Alert
                severity={meetsThreshold(request.loan_type, request.total_score_claimed) ? "success" : "warning"}
                sx={{ mt: 1 }}
              >
                {thresholdMessage(request.loan_type, request.total_score_claimed)}
              </Alert>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* ── Outstanding Balances ── */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Outstanding Loan Balances (if any)
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addBalance}>
                Add Balance
              </Button>
            </Stack>
            {mgrForm.outstanding_balances.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No outstanding balances added.
              </Typography>
            )}
            {mgrForm.outstanding_balances.map((b, idx) => (
              <Grid container spacing={1} key={idx} sx={{ mb: 1 }} alignItems="center">
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Balance Label (e.g. HL Outstanding)"
                    value={b.label}
                    onChange={(e) => updateBalance(idx, "label", e.target.value)} />
                </Grid>
                <Grid item xs={5}>
                  <TextField fullWidth size="small" label="Amount" type="number"
                    InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                    value={b.amount}
                    onChange={(e) => updateBalance(idx, "amount", e.target.value)} />
                </Grid>
                <Grid item xs={1}>
                  <IconButton color="error" size="small" onClick={() => removeBalance(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* ── Deduction Breakdown ── */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Deduction Breakdown
            </Typography>

            {/* Basic Salary (read-only reference) */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Basic Salary (Monthly)" disabled
                  value={request.basic_salary ? `ETB ${parseFloat(request.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
                  InputProps={{ readOnly: true }}
                  helperText="From employee record" />
              </Grid>
            </Grid>

            {/* Fixed deductions */}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Income Tax" type="number"
                  InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                  value={mgrForm.deduction_income_tax}
                  onChange={(e) => setMgr("deduction_income_tax", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="7% Pension" type="number"
                  InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                  value={mgrForm.deduction_pension_7}
                  onChange={(e) => setMgr("deduction_pension_7", e.target.value)} />
              </Grid>
            </Grid>

            {/* Dynamic other deductions */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Other Deductions
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addOtherItem}>
                Add Deduction
              </Button>
            </Stack>
            {mgrForm.deduction_other_items.map((item, idx) => (
              <Grid container spacing={1} key={idx} sx={{ mb: 1 }} alignItems="center">
                <Grid item xs={6}>
                  <TextField fullWidth size="small"
                    label="Deduction Label (e.g. ESL Repayment)"
                    value={item.label}
                    onChange={(e) => updateOtherItem(idx, "label", e.target.value)} />
                </Grid>
                <Grid item xs={5}>
                  <TextField fullWidth size="small" label="Amount" type="number"
                    InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                    value={item.amount}
                    onChange={(e) => updateOtherItem(idx, "amount", e.target.value)} />
                </Grid>
                <Grid item xs={1}>
                  <IconButton color="error" size="small" onClick={() => removeOtherItem(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            {/* Live totals */}
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Deduction:</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  ETB {totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography variant="body2">Net Salary After Deduction:</Typography>
                <Typography variant="body2" fontWeight="bold"
                  color={netSalary >= 0 ? "success.main" : "error.main"}>
                  ETB {netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Stack>
            </Paper>
          </Box>

          <TextField fullWidth multiline rows={3} label="Manager Remarks"
            value={mgrForm.manager_remarks}
            onChange={(e) => setMgr("manager_remarks", e.target.value)}
            sx={{ mb: 2 }} />

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => setPanel(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={submitManager} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Manager Review"}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Checker review panel ── */}
      {panel === "checker" && (
        <Paper elevation={3} sx={{ p: 3, mt: 2, border: "2px solid", borderColor: "secondary.main" }}>
          <Typography variant="h6" color="secondary" gutterBottom>
            <CheckerIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Manager, Employee Services Management — Disciplinary Record Verification
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Review the staff's self-declared disciplinary record and confirm your decision.
          </Alert>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Staff Self-Declaration</Typography>
            <Typography variant="body2">
              Band: <strong>{request.disciplinary_record_band || "—"}</strong>
              &nbsp;|&nbsp;
              Score: <strong>{request.disciplinary_record_score ?? 0} pts</strong>
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Disciplinary Record Verification *
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={chkForm.checker_disciplinary_verified === true ? "contained" : "outlined"}
                  color="success" startIcon={<CheckCircleIcon />}
                  onClick={() => setChkForm(p => ({ ...p, checker_disciplinary_verified: true }))}>
                  Verified — Record is Clean
                </Button>
                <Button
                  variant={chkForm.checker_disciplinary_verified === false ? "contained" : "outlined"}
                  color="error" startIcon={<CancelIcon />}
                  onClick={() => setChkForm(p => ({ ...p, checker_disciplinary_verified: false }))}>
                  Flag — Issue Found
                </Button>
              </Stack>
              {chkForm.checker_disciplinary_verified === false && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Flagging will set status to <strong>Not Recommended</strong>.
                </Alert>
              )}
            </Grid>

            {/* ── Loan Application Count verification ── */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" gutterBottom>Staff Declared</Typography>
                <Typography variant="body2">
                  Loan Application Count: <strong>{request.loan_application_count || "—"}</strong>
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Loan Application Count Verification *
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={chkForm.checker_loan_application_verified === true ? "contained" : "outlined"}
                  color="success" startIcon={<CheckCircleIcon />}
                  onClick={() => setChkForm(p => ({ ...p, checker_loan_application_verified: true }))}>
                  Confirmed — Count is Accurate
                </Button>
                <Button
                  variant={chkForm.checker_loan_application_verified === false ? "contained" : "outlined"}
                  color="error" startIcon={<CancelIcon />}
                  onClick={() => setChkForm(p => ({ ...p, checker_loan_application_verified: false }))}>
                  Flag — Discrepancy Found
                </Button>
              </Stack>
              {chkForm.checker_loan_application_verified === false && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Flagging the loan count will also set status to <strong>Not Recommended</strong>.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2}
                label="Loan Application Count Remarks (optional)"
                value={chkForm.checker_loan_application_remarks}
                onChange={(e) => setChkForm(p => ({ ...p, checker_loan_application_remarks: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Overall Checker Remarks"
                value={chkForm.checker_remarks}
                onChange={(e) => setChkForm(p => ({ ...p, checker_remarks: e.target.value }))} />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setPanel(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" color="secondary" onClick={submitChecker}
              disabled={submitting || chkForm.checker_disciplinary_verified === null || chkForm.checker_loan_application_verified === null}>
              {submitting ? "Submitting…" : "Submit Checker Review"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default StaffLoanRequestDetail;
