import React, { useState, useContext, useEffect } from "react";
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
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// ─── small helpers ────────────────────────────────────────────────────────────

const fmt = (date) => (date ? new Date(date).toLocaleDateString() : "—");
const fmtMoney = (v) => (v != null ? `ETB ${parseFloat(v).toLocaleString()}` : "—");
const fmtTs = (ts) =>
  ts ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

const statusColor = (s) => {
  const map = {
    Pending: "warning",
    "Manager Review": "info",
    "Checker Review": "info",
    Recommended: "success",
    "Not Recommended": "error",
    Approved: "success",
    Rejected: "error",
  };
  return map[s] || "default";
};

// ─── read-only info row ───────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <Grid item xs={12} md={6}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={500}>
      {value || "—"}
    </Typography>
  </Grid>
);

// ─── section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
    <Typography variant="h6" color="primary" gutterBottom>
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

// ─── band definitions (read-only display) ────────────────────────────────────
const SERVICE_BANDS      = ["10+ years (20 pts)", "6-10 years (15 pts)", "3-6 years (10 pts)", "1-3 years (5 pts)", "<1 year (0 pts)"];
const INDIVIDUAL_BANDS   = [">120% (50 pts)", "100-119.99% (40 pts)", "75-99.99% (30 pts)", "50-74.99% (20 pts)", "0-50% (10 pts)", "Not rated (0 pts)"];
const TEAM_BANDS         = [">120% (20 pts)", "100-119.99% (16 pts)", "75-99.99% (12 pts)", "50-74.99% (8 pts)", "0-50% (4 pts)", "Not rated (0 pts)"];
const DISCIPLINARY_BANDS = ["Clean record (10 pts)", "Minor sanction (10 pts)", "Major/active sanction (0 pts)"];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const StaffLoanRequestDetail = ({ request: initialRequest, onClose, onRefresh }) => {
  const { user } = useContext(AuthContext);
  const [request, setRequest]         = useState(initialRequest);
  const [loading,  setLoading]        = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  // which review panel is open
  const [panel, setPanel] = useState(null); // null | 'manager' | 'checker'

  // Re-fetch full record on mount — the list may have passed a partial row
  useEffect(() => {
    const fetchFull = async () => {
      try {
        const res = await axios.get(`${API_URL}/staff-loan-requests/${initialRequest.id}`);
        if (res.data.success) {
          setRequest(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch full loan request:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFull();
  }, [initialRequest.id]);

  // Initialise review form states after request loads
  const [mgrForm, setMgrForm] = useState({
    mgr_verified_service_score:    initialRequest.mgr_verified_service_score    ?? initialRequest.service_tenure_score    ?? 0,
    mgr_verified_individual_score: initialRequest.mgr_verified_individual_score ?? initialRequest.individual_performance_score ?? 0,
    mgr_verified_team_score:       initialRequest.mgr_verified_team_score       ?? initialRequest.team_performance_score  ?? 0,
    deduction_amount:  initialRequest.deduction_amount  ?? "",
    deduction_months:  initialRequest.deduction_months  ?? "",
    manager_remarks:   initialRequest.manager_remarks   ?? "",
  });

  // Sync mgrForm once full data arrives
  useEffect(() => {
    if (!loading) {
      setMgrForm({
        mgr_verified_service_score:    request.mgr_verified_service_score    ?? request.service_tenure_score    ?? 0,
        mgr_verified_individual_score: request.mgr_verified_individual_score ?? request.individual_performance_score ?? 0,
        mgr_verified_team_score:       request.mgr_verified_team_score       ?? request.team_performance_score  ?? 0,
        deduction_amount:  request.deduction_amount  ?? "",
        deduction_months:  request.deduction_months  ?? "",
        manager_remarks:   request.manager_remarks   ?? "",
      });
      setChkForm({
        checker_disciplinary_verified: request.checker_disciplinary_verified ?? null,
        checker_remarks: request.checker_remarks ?? "",
      });
    }
  }, [loading]);

  const [chkForm, setChkForm] = useState({
    checker_disciplinary_verified: initialRequest.checker_disciplinary_verified ?? null,
    checker_remarks: initialRequest.checker_remarks ?? "",
  });

  if (!request) return null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Loading request details…</Typography>
      </Box>
    );
  }

  const userTitle = user?.title || "";
  const isManager = userTitle === "Employee Manager";
  const isChecker = userTitle === "Employee Checker";
  const isEmergency = request.loan_type === "Emergency Loan";

  // whether this user can act
  const canManagerReview = isManager && !request.manager_verified;
  const canCheckerReview = isChecker && request.manager_verified && !request.checker_verified;

  // ── manager submit ──────────────────────────────────────────────────────────
  const submitManagerReview = async () => {
    if (!mgrForm.deduction_amount || !mgrForm.deduction_months) {
      toast.error("Deduction amount and repayment months are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/staff-loan-requests/${request.id}/manager-review`, {
        reviewer_title: "Employee Manager",
        reviewer_email: user?.MailAdress || user?.email,
        ...mgrForm,
      });
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
  const submitCheckerReview = async () => {
    if (chkForm.checker_disciplinary_verified === null) {
      toast.error("Please select a disciplinary verification decision.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/staff-loan-requests/${request.id}/checker-review`, {
        reviewer_title: "Employee Checker",
        reviewer_email: user?.MailAdress || user?.email,
        ...chkForm,
      });
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

  const mgrTotal =
    (parseInt(mgrForm.mgr_verified_service_score)    || 0) +
    (parseInt(mgrForm.mgr_verified_individual_score) || 0) +
    (parseInt(mgrForm.mgr_verified_team_score)       || 0);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Loan Request #{request.id}
          </Typography>
          <Chip label={request.status} color={statusColor(request.status)} />
          {request.loan_type === "Emergency Loan" && (
            <Chip label="Emergency Loan" color="error" variant="outlined" />
          )}
        </Box>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Close</Button>
      </Box>

      {/* ── Workflow progress bar ── */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <StepBadge
            label="1. Submitted"
            done={true}
            by={request.created_by}
            at={fmtTs(request.created_at)}
          />
          <Typography color="text.secondary">→</Typography>
          <StepBadge
            label="2. Manager Review"
            done={!!request.manager_verified}
            by={request.manager_verified_by}
            at={fmtTs(request.manager_verified_at)}
          />
          <Typography color="text.secondary">→</Typography>
          <StepBadge
            label="3. Checker Review"
            done={!!request.checker_verified}
            by={request.checker_verified_by}
            at={fmtTs(request.checker_verified_at)}
          />
        </Stack>
      </Paper>

      {/* ── Employee Information ── */}
      <Section title="Employee Information">
        <Grid container spacing={2}>
          <InfoRow label="Full Name"           value={request.full_name} />
          <InfoRow label="Employee ID"         value={request.employee_id} />
          <InfoRow label="Date of Birth"       value={fmt(request.dob)} />
          <InfoRow label="Branch"              value={request.branch_name} />
          <InfoRow label="Position / Title"    value={request.position_title} />
          <InfoRow label="Date of Hire"        value={fmt(request.date_of_hire)} />
          <InfoRow label="Length of Service"   value={request.length_of_service_years ? `${request.length_of_service_years} years` : null} />
          <InfoRow label="Phone / Extension"   value={request.phone_extension} />
          <InfoRow label="Date of Request"     value={fmt(request.date_of_request)} />
          <InfoRow label="Retirement Date"     value={fmt(request.retirement_date)} />
        </Grid>
      </Section>

      {/* ── Loan Details ── */}
      <Section title="Loan Request Details">
        <Grid container spacing={2}>
          <InfoRow label="Loan Type"               value={request.loan_type} />
          <InfoRow label="Loan Amount Requested"   value={fmtMoney(request.loan_amount_requested)} />
          <InfoRow label="Basic Salary (Monthly)"  value={fmtMoney(request.basic_salary)} />
          <InfoRow label="Application Count"       value={request.loan_application_count} />
          <InfoRow label="Purpose"                 value={request.loan_purpose} />
        </Grid>
      </Section>

      {/* ── Scoring Criteria — hidden for Emergency Loan ── */}
      {!isEmergency && (
        <Section title="Self-Assessment Scoring Criteria">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell><strong>Criterion</strong></TableCell>
                  <TableCell><strong>Band Selected</strong></TableCell>
                  <TableCell align="center"><strong>Weight</strong></TableCell>
                  <TableCell align="center"><strong>Staff Score</strong></TableCell>
                  <TableCell align="center"><strong>Manager Verified</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1. Length of Service</TableCell>
                  <TableCell>{request.service_tenure_band || "—"}</TableCell>
                  <TableCell align="center">0–20</TableCell>
                  <TableCell align="center">
                    <Chip label={request.service_tenure_score ?? 0} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {request.manager_verified
                      ? <Chip label={request.mgr_verified_service_score ?? 0} color="success" size="small" />
                      : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2. Individual Performance</TableCell>
                  <TableCell>{request.individual_performance_band || "—"}</TableCell>
                  <TableCell align="center">0–50</TableCell>
                  <TableCell align="center">
                    <Chip label={request.individual_performance_score ?? 0} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {request.manager_verified
                      ? <Chip label={request.mgr_verified_individual_score ?? 0} color="success" size="small" />
                      : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3. Team Performance</TableCell>
                  <TableCell>{request.team_performance_band || "—"}</TableCell>
                  <TableCell align="center">0–20</TableCell>
                  <TableCell align="center">
                    <Chip label={request.team_performance_score ?? 0} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {request.manager_verified
                      ? <Chip label={request.mgr_verified_team_score ?? 0} color="success" size="small" />
                      : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>6. Disciplinary Record</TableCell>
                  <TableCell>{request.disciplinary_record_band || "—"}</TableCell>
                  <TableCell align="center">0–10</TableCell>
                  <TableCell align="center">
                    <Chip label={request.disciplinary_record_score ?? 0} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {request.checker_verified
                      ? (
                        <Chip
                          label={request.checker_disciplinary_verified ? "Verified ✓" : "Flagged ✗"}
                          color={request.checker_disciplinary_verified ? "success" : "error"}
                          size="small"
                        />
                      )
                      : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                  </TableCell>
                </TableRow>
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

      {/* ── Manager deduction summary (once filled) ── */}
      {request.manager_verified && (
        <Section title="Manager Review — Deduction Details">
          <Grid container spacing={2}>
            <InfoRow label="Verified By"              value={request.manager_verified_by} />
            <InfoRow label="Reviewed At"              value={fmtTs(request.manager_verified_at)} />
            <InfoRow label="Monthly Deduction"        value={fmtMoney(request.deduction_amount)} />
            <InfoRow label="Repayment Period"         value={request.deduction_months ? `${request.deduction_months} months` : null} />
            <InfoRow label="Net Salary After Deduction" value={fmtMoney(request.net_salary_after_deduction)} />
            <InfoRow label="Manager Remarks"          value={request.manager_remarks} />
          </Grid>
        </Section>
      )}

      {/* ── Checker summary (once filled) ── */}
      {request.checker_verified && (
        <Section title="Checker Review — Disciplinary Verification">
          <Grid container spacing={2}>
            <InfoRow label="Verified By" value={request.checker_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.checker_verified_at)} />
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Disciplinary Record Status
              </Typography>
              <Chip
                label={request.checker_disciplinary_verified ? "Clean — Verified ✓" : "Issue Flagged ✗"}
                color={request.checker_disciplinary_verified ? "success" : "error"}
              />
            </Grid>
            <InfoRow label="Checker Remarks" value={request.checker_remarks} />
          </Grid>
        </Section>
      )}

      {/* ── Attached Document ── */}
      <Section title="Attached Document">
        {request.attachment_file_name ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <AttachFileIcon color="primary" />
            <Typography variant="body1" sx={{ flex: 1, wordBreak: "break-all" }}>
              {request.attachment_file_name}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() =>
                window.open(`${API_URL}/staff-loan-requests/${request.id}/document`, "_blank")
              }
            >
              View
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const a = document.createElement("a");
                a.href = `${API_URL}/staff-loan-requests/${request.id}/document`;
                a.setAttribute("download", request.attachment_file_name);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              Download
            </Button>
          </Stack>
        ) : (
          <Alert severity="warning">No document attached to this request.</Alert>
        )}
      </Section>

      {/* ── Review action buttons ── */}
      {(canManagerReview || canCheckerReview) && panel === null && (
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          {canManagerReview && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ManagerIcon />}
              onClick={() => setPanel("manager")}
            >
              Manager Review & Verify
            </Button>
          )}
          {canCheckerReview && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<CheckerIcon />}
              onClick={() => setPanel("checker")}
            >
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
            Employee Manager — Review & Verification
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Verify the auto-calculated scores and complete the deduction fields.
            Net salary is calculated automatically.
          </Alert>

          <Grid container spacing={2}>
            {/* Score verification — hidden for emergency loans */}
            {!isEmergency && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Verified Scores
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth label="Service Score (0–20)"
                    type="number" inputProps={{ min: 0, max: 20 }}
                    value={mgrForm.mgr_verified_service_score}
                    onChange={(e) => setMgrForm((p) => ({ ...p, mgr_verified_service_score: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth label="Individual Performance Score (0–50)"
                    type="number" inputProps={{ min: 0, max: 50 }}
                    value={mgrForm.mgr_verified_individual_score}
                    onChange={(e) => setMgrForm((p) => ({ ...p, mgr_verified_individual_score: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth label="Team Performance Score (0–20)"
                    type="number" inputProps={{ min: 0, max: 20 }}
                    value={mgrForm.mgr_verified_team_score}
                    onChange={(e) => setMgrForm((p) => ({ ...p, mgr_verified_team_score: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 1.5, bgcolor: "primary.light", display: "inline-block", borderRadius: 1 }}>
                    <Typography color="white" fontWeight="bold">
                      Verified Total: {mgrTotal} / 90 pts  (excl. disciplinary)
                    </Typography>
                  </Paper>
                </Grid>
              </>
            )}

            {/* Deduction fields */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                Deduction & Affordability
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth required label="Monthly Deduction Amount"
                type="number"
                InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                value={mgrForm.deduction_amount}
                onChange={(e) => setMgrForm((p) => ({ ...p, deduction_amount: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth required label="Repayment Period (months)"
                type="number" inputProps={{ min: 1 }}
                value={mgrForm.deduction_months}
                onChange={(e) => setMgrForm((p) => ({ ...p, deduction_months: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Net Salary After Deduction"
                value={
                  mgrForm.deduction_amount && request.basic_salary
                    ? `ETB ${(parseFloat(request.basic_salary) - parseFloat(mgrForm.deduction_amount || 0)).toLocaleString()}`
                    : "—"
                }
                disabled InputProps={{ readOnly: true }}
                helperText="Auto-calculated"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3} label="Manager Remarks"
                value={mgrForm.manager_remarks}
                onChange={(e) => setMgrForm((p) => ({ ...p, manager_remarks: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setPanel(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained" color="primary"
              onClick={submitManagerReview}
              disabled={submitting}
            >
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
            Employee Checker — Disciplinary Record Verification
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Review the employee's disciplinary and conduct record and confirm your decision.
          </Alert>

          {/* Show what the staff self-declared */}
          <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
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
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setChkForm((p) => ({ ...p, checker_disciplinary_verified: true }))}
                >
                  Verified — Record is Clean
                </Button>
                <Button
                  variant={chkForm.checker_disciplinary_verified === false ? "contained" : "outlined"}
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setChkForm((p) => ({ ...p, checker_disciplinary_verified: false }))}
                >
                  Flag — Issue Found
                </Button>
              </Stack>
              {chkForm.checker_disciplinary_verified === false && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Flagging this record will set the status to <strong>Not Recommended</strong>.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3} label="Checker Remarks"
                value={chkForm.checker_remarks}
                onChange={(e) => setChkForm((p) => ({ ...p, checker_remarks: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setPanel(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained" color="secondary"
              onClick={submitCheckerReview}
              disabled={submitting || chkForm.checker_disciplinary_verified === null}
            >
              {submitting ? "Submitting…" : "Submit Checker Review"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

// ─── Workflow step badge ──────────────────────────────────────────────────────
const StepBadge = ({ label, done, by, at }) => (
  <Box sx={{ textAlign: "center", minWidth: 140 }}>
    <Chip
      label={label}
      color={done ? "success" : "default"}
      icon={done ? <CheckCircleIcon /> : undefined}
      size="small"
    />
    {done && by && (
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
        {by}
      </Typography>
    )}
    {done && at && (
      <Typography variant="caption" display="block" color="text.secondary">
        {at}
      </Typography>
    )}
  </Box>
);

export default StaffLoanRequestDetail;
