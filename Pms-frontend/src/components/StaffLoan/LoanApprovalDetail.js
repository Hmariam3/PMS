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
const fmt    = (d)  => d  ? new Date(d).toLocaleDateString("en-GB") : "—";
const fmtTs  = (ts) => ts ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtMoney = (v) =>
  v != null && v !== "" ? `ETB ${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—";

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

// Workflow step badge — mirrors StaffLoanRequestDetail
const StepBadge = ({ label, done, fullName, email, at }) => (
  <Box sx={{ textAlign: "center", minWidth: 150 }}>
    <Chip
      label={label}
      color={done ? "success" : "default"}
      icon={done ? <CheckCircleIcon /> : undefined}
      size="small"
      sx={{ mb: 0.5 }}
    />
    {done && fullName && (
      <Typography variant="caption" display="block" color="text.primary" fontWeight={500}>{fullName}</Typography>
    )}
    {done && email && (
      <Typography variant="caption" display="block" color="text.secondary">{email}</Typography>
    )}
    {done && at && (
      <Typography variant="caption" display="block" color="text.secondary">{at}</Typography>
    )}
  </Box>
);

// ─── Reusable deduction table (borrower or guarantor) ─────────────────────────
const DeductionTable = ({ basicSalary, incomeTax, pension7, otherItems, deductionAmount, totalDeduction, netSalary, outstandingBalances, deductionMonths }) => {
  const others = Array.isArray(otherItems)
    ? otherItems
    : (otherItems ? JSON.parse(otherItems) : []);
  const balances = Array.isArray(outstandingBalances)
    ? outstandingBalances
    : (outstandingBalances ? JSON.parse(outstandingBalances) : []);

  return (
    <>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Basic Salary</TableCell>
              <TableCell align="right"><strong>{fmtMoney(basicSalary)}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Income Tax</TableCell>
              <TableCell align="right">{fmtMoney(incomeTax)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>7% Pension</TableCell>
              <TableCell align="right">{fmtMoney(pension7)}</TableCell>
            </TableRow>
            {others.map((d, i) => (
              <TableRow key={i}>
                <TableCell>{d.label}</TableCell>
                <TableCell align="right">{fmtMoney(d.amount)}</TableCell>
              </TableRow>
            ))}
            {deductionAmount != null && deductionAmount !== "" && (
              <TableRow>
                <TableCell>Loan Repayment (this loan)</TableCell>
                <TableCell align="right">{fmtMoney(deductionAmount)}</TableCell>
              </TableRow>
            )}
            <TableRow sx={{ bgcolor: "error.light" }}>
              <TableCell><strong>Total Deduction</strong></TableCell>
              <TableCell align="right"><strong>{fmtMoney(totalDeduction)}</strong></TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "success.light" }}>
              <TableCell><strong>Net Salary After Deduction</strong></TableCell>
              <TableCell align="right"><strong>{fmtMoney(netSalary)}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {balances.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Outstanding Loan Balances
          </Typography>
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
      )}

      {deductionMonths > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Repayment Period: <strong>{deductionMonths} months</strong>
        </Typography>
      )}
    </>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

const LoanApprovalDetail = ({ request: initialRequest, onClose, onApproved }) => {
  const { user } = useContext(AuthContext);

  const [request, setRequest]                   = useState(initialRequest);
  const [fetching, setFetching]                 = useState(true);
  const [submitting, setSubmitting]             = useState(false);
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [approverRemarks, setApproverRemarks]   = useState("");

  const isApprover =
    user?.title === "Employee Approver" ||
    user?.title === "Enterprise System Operation and Application Developer";

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

  // Org-unit flags — use previous_organization_unit to match StaffLoanRequestDetail
  const effectiveOrgUnit = request.previous_organization_unit || request.employee_organization_unit || "";
  const orgLower = effectiveOrgUnit.toLowerCase();
  const isBranch = orgLower.includes("branch") || (!orgLower.includes("district") && !orgLower.includes("head") && orgLower !== "ho" && orgLower !== "do");
  const isDO     = orgLower.includes("district") || orgLower === "do";
  const isHO     = orgLower.includes("head")     || orgLower === "ho";

  // Guarantor consent
  const hasGuarantor     = !!request.guarantor_user;
  const guarantorConsent = request.guarantor_consent || "Pending";

  // Threshold logic (mirrors StaffLoanRequestDetail)
  const titleLower = (request.previous_position_title || request.position_title || "").toLowerCase();
  const isCashierOrController = titleLower.includes("cashier") || titleLower.includes("internal controller");
  let THRESHOLDS = { "Automobile": 100, "Housing/Mortgage": 100, "Personal Against Suretyship": 100, "Emergency Loan": 0 };
  if (isBranch) {
    THRESHOLDS = isCashierOrController
      ? { "Automobile": 95, "Housing/Mortgage": 95, "Personal Against Suretyship": 85, "Emergency Loan": 0 }
      : { "Automobile": 70, "Housing/Mortgage": 70, "Personal Against Suretyship": 65, "Emergency Loan": 0 };
  } else if (isDO) {
    THRESHOLDS = { "Automobile": 85, "Housing/Mortgage": 85, "Personal Against Suretyship": 75, "Emergency Loan": 0 };
  } else if (isHO) {
    THRESHOLDS = { "Automobile": 80, "Housing/Mortgage": 80, "Personal Against Suretyship": 70, "Emergency Loan": 0 };
  }

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/staff-loan-requests/${request.id}/approve`,
        {
          reviewer_title:   user?.title,
          reviewer_email:   user?.MailAdress || user?.email,
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
      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Loan Request #{request.id}
          </Typography>
          <Chip
            label={request.status}
            color={request.status === "Approved" ? "success" : request.status === "Recommended" ? "info" : "default"}
          />
          {isEmergency && <Chip label="Emergency Loan" color="error" variant="outlined" />}
          {request.special_review && (
            <Chip label="⚠️ Special Review" color="warning" variant="filled" />
          )}
        </Box>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Close</Button>
      </Box>

      {/* Special review notice */}
      {request.special_review && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Special Review Case:</strong> This request did not meet the score threshold
          but was forwarded because the shortfall is solely due to Length of Service (Criterion 1).
          The employee's performance-based criteria are strong. Please review carefully before
          making a final decision.
        </Alert>
      )}

      {/* ── Workflow progress ── */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <StepBadge
            label={request.branch_name || request.employee_organization_unit || "Requester Team"}
            done
            fullName={request.full_name}
            email={request.created_by}
            at={fmtTs(request.created_at)}
          />
          <Typography color="text.secondary">→</Typography>
          <StepBadge
            label={request.checker_team || "Employee Services Management Team"}
            done={!!request.checker_verified}
            fullName={request.checker_full_name}
            email={request.checker_verified_by}
            at={fmtTs(request.checker_verified_at)}
          />
          <Typography color="text.secondary">→</Typography>
          <StepBadge
            label={request.manager_team || "Payroll Administration Team"}
            done={!!request.manager_verified}
            fullName={request.manager_full_name}
            email={request.manager_verified_by}
            at={fmtTs(request.manager_verified_at)}
          />
          <Typography color="text.secondary">→</Typography>
          <StepBadge
            label="Final Approval"
            done={request.status === "Approved"}
            fullName={request.approved_by}
            at={fmtTs(request.approved_at)}
          />
        </Stack>
      </Paper>

      {/* ── Employee Information ── */}
      <Section title="Employee Information">
        <Grid container spacing={2}>
          <InfoRow label="Full Name"                  value={request.full_name} />
          <InfoRow label="Employee ID"                value={request.employee_id} />
          <InfoRow label="Date of Birth"              value={fmt(request.dob)} />
          <InfoRow label="Branch"                     value={request.branch_name} />
          <InfoRow label="Current Position / Title"   value={request.position_title} />
          <InfoRow label="Previous Position / Title"  value={request.previous_position_title} />
          <InfoRow label="Date of Hire"               value={fmt(request.date_of_hire)} />
          <InfoRow label="Length of Service"          value={request.length_of_service_years ? `${request.length_of_service_years} yrs` : null} />
          <InfoRow label="Retirement Date"            value={fmt(request.retirement_date)} />
          {request.employee_organization_unit && (
            <InfoRow label="Current Organization Unit" value={request.employee_organization_unit} />
          )}
          {request.previous_organization_unit && (
            <InfoRow label="Previous Organization Unit" value={request.previous_organization_unit} />
          )}
        </Grid>
      </Section>

      {/* ── Loan Request Details ── */}
      <Section title="Loan Request Details">
        <Grid container spacing={2}>
          <InfoRow label="Loan Type"              value={request.loan_type} />
          <InfoRow label="Amount Requested"       value={fmtMoney(request.loan_amount_requested)} />
          <InfoRow label="Basic Salary"           value={fmtMoney(request.basic_salary)} />
          <InfoRow label="Application Count"      value={request.loan_application_count} />
          <InfoRow label="Loan Processing Branch" value={request.loan_processing_branch} />
          {request.guarantor_user && (
            <InfoRow label="Guarantor Full Name" value={request.guarantor_user} />
          )}
          {request.guarantor_basic_salary && (
            <InfoRow label="Guarantor Basic Salary" value={fmtMoney(request.guarantor_basic_salary)} />
          )}
        </Grid>
      </Section>

      {/* ── Scoring Criteria ── */}
      {!isEmergency && (() => {
        const total     = request.total_score_claimed ?? 0;
        const tenure    = request.service_tenure_score ?? 0;
        const threshold = THRESHOLDS[request.loan_type] ?? 100;
        const passes    = total >= threshold;
        const scoreWithoutTenure     = total - tenure;
        const wouldPassWithMaxTenure = (scoreWithoutTenure + 20) >= threshold;
        const isSpecialReview = !passes && wouldPassWithMaxTenure;

        return (
          <Section title="Self-Assessment Scoring Criteria">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell><strong>Criterion</strong></TableCell>
                    <TableCell><strong>Band</strong></TableCell>
                    <TableCell align="center"><strong>Weight</strong></TableCell>
                    <TableCell align="center"><strong>Score</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Criterion 1 — all staff */}
                  <TableRow>
                    <TableCell>1. Length of Service</TableCell>
                    <TableCell>{request.service_tenure_band || "—"}</TableCell>
                    <TableCell align="center">0–20</TableCell>
                    <TableCell align="center">
                      <Chip label={request.service_tenure_score ?? 0} color="primary" size="small" />
                    </TableCell>
                  </TableRow>

                  {/* Criterion 2 — Branch staff */}
                  {isBranch && (
                    <TableRow>
                      <TableCell>2. Individual Performance</TableCell>
                      <TableCell>{request.individual_performance_band || "—"}</TableCell>
                      <TableCell align="center">0–70</TableCell>
                      <TableCell align="center">
                        <Chip label={request.individual_performance_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Criterion 5 — DO or HO */}
                  {(isDO || isHO) && (
                    <TableRow>
                      <TableCell>5. OKR &amp; KPIs Result</TableCell>
                      <TableCell>{request.okr_kpi_band || "—"}</TableCell>
                      <TableCell align="center">0–70</TableCell>
                      <TableCell align="center">
                        <Chip label={request.okr_kpi_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Criterion 6 — all staff */}
                  <TableRow>
                    <TableCell>6. Disciplinary Record</TableCell>
                    <TableCell>{request.disciplinary_record_band || "—"}</TableCell>
                    <TableCell align="center">0–10</TableCell>
                    <TableCell align="center">
                      <Chip label={request.disciplinary_record_score ?? 0} color="primary" size="small" />
                    </TableCell>
                  </TableRow>

                  {/* Total */}
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell colSpan={2}><strong>Total Score</strong></TableCell>
                    <TableCell align="center"><strong>0–100</strong></TableCell>
                    <TableCell align="center">
                      <Chip label={`${total} pts`} color="primary" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Threshold pass/fail alert */}
            <Box sx={{ mt: 1.5 }}>
              <Alert severity={passes ? "success" : isSpecialReview ? "warning" : "error"}>
                <strong>
                  {passes ? "✅ Meets Threshold"
                    : isSpecialReview ? "⚠️ Below Threshold — Special Review"
                    : "❌ Does Not Meet Threshold"}
                </strong>
                {"  "}
                {total >= threshold
                  ? `Score ${total} / 100 meets the threshold of ${threshold} for ${request.loan_type}.`
                  : `Score ${total} / 100 is below the threshold of ${threshold} for ${request.loan_type}.`
                }
              </Alert>

              {isSpecialReview && (
                <Paper variant="outlined" sx={{ mt: 1.5, p: 2, borderColor: "warning.main", bgcolor: "warning.light", borderWidth: 2 }}>
                  <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                    📋 Special Review Notice — Length of Service Impact
                  </Typography>
                  <Typography variant="body2">
                    Shortfall of <strong>{threshold - total} pts</strong> vs threshold of <strong>{threshold} pts</strong>.
                    Performance score (excl. tenure): <strong>{scoreWithoutTenure} pts</strong>.
                    With max tenure (<strong>20 pts</strong>) the total would be <strong>{scoreWithoutTenure + 20} pts</strong>.
                  </Typography>
                </Paper>
              )}
            </Box>
          </Section>
        );
      })()}

      {/* ── Payroll Administration Team Review ── */}
      {request.manager_verified && (
        <Section title="Payroll Administration Team Review — Salary & Deduction Summary">
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <InfoRow label="Reviewed By" value={request.manager_full_name || request.manager_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.manager_verified_at)} />
          </Grid>
          <Divider sx={{ my: 2 }} />

          {/* Borrower */}
          <Typography variant="subtitle2" color="primary" gutterBottom>Borrower Deduction Breakdown</Typography>
          <DeductionTable
            basicSalary={request.basic_salary}
            incomeTax={request.deduction_income_tax}
            pension7={request.deduction_pension_7}
            otherItems={request.deduction_other_items}
            deductionAmount={request.deduction_amount}
            totalDeduction={request.total_deduction}
            netSalary={request.net_salary_after_deduction}
            outstandingBalances={request.outstanding_balances}
            deductionMonths={request.deduction_months}
          />

          {/* Guarantor */}
          {(request.guarantor_basic_salary || request.guarantor_total_deduction) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="secondary.main" gutterBottom>Guarantor Deduction Breakdown</Typography>
              <DeductionTable
                basicSalary={request.guarantor_basic_salary}
                incomeTax={request.guarantor_deduction_income_tax}
                pension7={request.guarantor_deduction_pension_7}
                otherItems={request.guarantor_deduction_other_items}
                deductionAmount={request.guarantor_deduction_amount}
                totalDeduction={request.guarantor_total_deduction}
                netSalary={request.guarantor_net_salary_after_deduction}
                outstandingBalances={request.guarantor_outstanding_balances}
                deductionMonths={request.guarantor_deduction_months}
              />
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {request.loan_processor_assigned && (
              <InfoRow label="Assigned Loan Processor" value={request.loan_processor_assigned} />
            )}
            <InfoRow label="Manager Remarks" value={request.manager_remarks} />
          </Grid>
        </Section>
      )}

      {/* ── Employee Services Management Team Review ── */}
      {request.checker_verified && (
        <Section title="Employee Services Management Team Review — Disciplinary & Loan Count Verification">
          <Grid container spacing={2}>
            <InfoRow label="Verified By" value={request.checker_full_name || request.checker_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.checker_verified_at)} />
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Disciplinary Record</Typography>
              <Chip
                label={request.checker_disciplinary_verified ? "Clean — Verified ✓" : "Issue Flagged ✗"}
                color={request.checker_disciplinary_verified ? "success" : "error"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Loan Application Count</Typography>
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

      {/* ── Guarantor Consent Status ── */}
      {hasGuarantor && (
        <Section title="Guarantor Consent Status">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Guarantor</Typography>
              <Typography variant="body1" fontWeight={500}>{request.guarantor_user}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">Consent Decision</Typography>
              <Chip
                label={
                  guarantorConsent === "Accepted" ? "Accepted ✓" :
                  guarantorConsent === "Declined" ? "Declined ✗" : "Awaiting Consent"
                }
                color={
                  guarantorConsent === "Accepted" ? "success" :
                  guarantorConsent === "Declined" ? "error" : "warning"
                }
                sx={{ fontWeight: 700 }}
              />
            </Grid>
            {request.guarantor_consent_at && (
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" display="block">Responded At</Typography>
                <Typography variant="body2">{fmtTs(request.guarantor_consent_at)}</Typography>
              </Grid>
            )}
            {request.guarantor_consent_remarks && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" display="block">Guarantor Remarks</Typography>
                <Typography variant="body2">{request.guarantor_consent_remarks}</Typography>
              </Grid>
            )}
          </Grid>
        </Section>
      )}

      {/* ── Attached Documents ── */}
      <Section title="Attached Documents">
        {/* Borrower */}
        <Typography variant="subtitle2" gutterBottom>Borrower Document</Typography>
        {request.attachment_file_name ? (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
          <Alert severity="warning" sx={{ mb: 2 }}>No borrower document attached.</Alert>
        )}

        {/* Guarantor */}
        <Typography variant="subtitle2" gutterBottom>Guarantor Document</Typography>
        {request.guarantor_attachment_file_name ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <AttachFileIcon color="secondary" />
            <Typography variant="body1" sx={{ flex: 1, wordBreak: "break-all" }}>
              {request.guarantor_attachment_file_name}
            </Typography>
            <Button variant="outlined" color="secondary" startIcon={<VisibilityIcon />}
              onClick={() => window.open(`${API_URL}/staff-loan-requests/${request.id}/guarantor-document`, "_blank")}>
              View
            </Button>
            <Button variant="contained" color="secondary" startIcon={<DownloadIcon />}
              onClick={() => {
                const a = document.createElement("a");
                a.href = `${API_URL}/staff-loan-requests/${request.id}/guarantor-document`;
                a.setAttribute("download", request.guarantor_attachment_file_name);
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}>
              Download
            </Button>
          </Stack>
        ) : (
          <Alert severity="info">No guarantor document attached.</Alert>
        )}
      </Section>

      {/* ── Final Approval action ── */}
      {isApprover && request.status === "Recommended" && !showApprovePanel && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained" color="success" size="large"
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
            will be able to download their official approval letter.
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

      {/* ── Approval Letter (already approved) ── */}
      {request.status === "Approved" && (
        <Section title="Approval Letter">
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>Approved by:</strong> {request.approved_by || "—"}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>On:</strong> {fmtTs(request.approved_at)}
            {request.approver_remarks && (
              <><br /><strong>Remarks:</strong> {request.approver_remarks}</>
            )}
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
              variant="contained" color="success"
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
