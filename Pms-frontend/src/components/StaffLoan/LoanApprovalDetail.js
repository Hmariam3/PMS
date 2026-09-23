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

  const [request, setRequest]           = useState(initialRequest);
  const [fetching, setFetching]         = useState(true);
  const [submitting, setSubmitting]     = useState(false);
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

  // Org-unit flags for scoring display
  const orgLower = (request.employee_organization_unit || "").toLowerCase();
  const isBranch = orgLower.includes("branch") || (!orgLower.includes("district") && !orgLower.includes("head") && orgLower !== "ho" && orgLower !== "do");
  const isDO     = orgLower.includes("district") || orgLower === "do";
  const isHO     = orgLower.includes("head")     || orgLower === "ho";

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/staff-loan-requests/${request.id}/approve`,
        {
          reviewer_title:  user?.title,
          reviewer_email:  user?.MailAdress || user?.email,
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
        </Box>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Close</Button>
      </Box>

      {/* ── Employee Information ── */}
      <Section title="Employee Information">
        <Grid container spacing={2}>
          <InfoRow label="Full Name"         value={request.full_name} />
          <InfoRow label="Employee ID"       value={request.employee_id} />
          <InfoRow label="Date of Birth"     value={fmt(request.dob)} />
          <InfoRow label="Branch"            value={request.branch_name} />
          <InfoRow label="Position / Title"  value={request.position_title} />
          <InfoRow label="Date of Hire"      value={fmt(request.date_of_hire)} />
          <InfoRow label="Length of Service" value={request.length_of_service_years ? `${request.length_of_service_years} yrs` : null} />
          <InfoRow label="Retirement Date"   value={fmt(request.retirement_date)} />
          {request.employee_organization_unit && (
            <InfoRow label="Organization Unit" value={request.employee_organization_unit} />
          )}
        </Grid>
      </Section>

      {/* ── Loan Details ── */}
      <Section title="Loan Details">
        <Grid container spacing={2}>
          <InfoRow label="Loan Type"              value={request.loan_type} />
          <InfoRow label="Amount Requested"       value={fmtMoney(request.loan_amount_requested)} />
          <InfoRow label="Basic Salary"           value={fmtMoney(request.basic_salary)} />
          <InfoRow label="Application Count"      value={request.loan_application_count} />
          <InfoRow label="Loan Processing Branch" value={request.loan_processing_branch} />
          {request.guarantor_basic_salary && (
            <>
              <InfoRow label="Guarantor Basic Salary" value={fmtMoney(request.guarantor_basic_salary)} />
              <InfoRow
                label="Guarantor 7% Pension"
                value={fmtMoney(parseFloat(request.guarantor_basic_salary) * 0.07)}
              />
            </>
          )}
        </Grid>
      </Section>

      {/* ── Scoring Criteria ── */}
      {!isEmergency && (
        <Section title="Scoring Criteria">
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

                {/* Criteria 2 & 3 — Branch staff */}
                {(isBranch) && (
                  <>
                    <TableRow>
                      <TableCell>2. Individual Performance</TableCell>
                      <TableCell>{request.individual_performance_band || "—"}</TableCell>
                      <TableCell align="center">0–50</TableCell>
                      <TableCell align="center">
                        <Chip label={request.individual_performance_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3. Team Performance</TableCell>
                      <TableCell>{request.team_performance_band || "—"}</TableCell>
                      <TableCell align="center">0–20</TableCell>
                      <TableCell align="center">
                        <Chip label={request.team_performance_score ?? 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                  </>
                )}

                {/* Criterion 4 — DO only */}
                {isDO && request.district_engagement_band && (
                  <TableRow>
                    <TableCell>4. District Office Engagement</TableCell>
                    <TableCell>{request.district_engagement_band}</TableCell>
                    <TableCell align="center">0–50</TableCell>
                    <TableCell align="center">
                      <Chip label={request.district_engagement_score ?? 0} color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                )}

                {/* Criterion 5 — DO or HO */}
                {(isDO || isHO) && request.okr_kpi_band && (
                  <TableRow>
                    <TableCell>5. OKR & KPIs Result</TableCell>
                    <TableCell>{request.okr_kpi_band}</TableCell>
                    <TableCell align="center">0–{isHO ? 70 : 20}</TableCell>
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
                    <Chip label={`${request.total_score_claimed ?? 0} pts`} color="primary" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      )}

      {/* ── Salary & Deduction Summary ── */}
      {request.manager_verified && (
        <Section title="Salary & Deduction Summary">
          {/* Borrower */}
          <Typography variant="subtitle2" color="primary" gutterBottom>Borrower</Typography>
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

          {/* Guarantor — shown only when data exists */}
          {(request.guarantor_basic_salary || request.guarantor_total_deduction) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="secondary.main" gutterBottom>Guarantor</Typography>
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
            <InfoRow label="Reviewed By (Payroll)" value={request.manager_verified_by} />
            <InfoRow label="Reviewed At"           value={fmtTs(request.manager_verified_at)} />
            <InfoRow label="Manager Remarks"       value={request.manager_remarks} />
          </Grid>
        </Section>
      )}

      {/* ── Checker Review Summary ── */}
      {request.checker_verified && (
        <Section title="Checker Review Summary">
          <Grid container spacing={2}>
            <InfoRow label="Reviewed By" value={request.checker_verified_by} />
            <InfoRow label="Reviewed At" value={fmtTs(request.checker_verified_at)} />
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Disciplinary Record
              </Typography>
              <Chip
                label={request.checker_disciplinary_verified ? "Clean ✓" : "Flagged ✗"}
                color={request.checker_disciplinary_verified ? "success" : "error"}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Loan Application Count
              </Typography>
              <Chip
                label={request.checker_loan_application_verified ? "Confirmed ✓" : "Discrepancy ✗"}
                color={request.checker_loan_application_verified ? "success" : "error"}
                size="small"
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
