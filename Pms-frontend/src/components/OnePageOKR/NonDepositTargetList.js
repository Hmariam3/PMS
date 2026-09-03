import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link,
  Grid,
  TextField,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: 600 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const NonDepositTargetList = () => {
  const { user } = useContext(AuthContext);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  const [target, setTarget] = useState({
    new_account: "",
    unauthorized_transaction: "",
    active_card_no: "",
    eeu_transaction_count: "",

    merchant_recruitment: "",
    merchant_transaction_volume: "",
    agent_recruitment: "",
    agent_transaction_volume: "",
    michu_unique_recruitment: "",
    digital_transaction_volume: "",
    coopay_ebirr_activation: "",
    cash_balance_accuracy_rate: "",
    pos_deployment: "",
    avg_txn_per_cso: "",
    compliance_rate: "",
    reports_3days_rate: "",
    audit_report_quality: "",
    cash_surprise_checks: "",
    employee_perf_threshold: "",
    transaction_audit_rate: "",
    gl: "",
    customer_engagement: "",
    new_customer_onboarding: "",
    armingc_deposit_proportion: "",
    gl: "",
    coopapp_business_onboarding: "",
    new_bill_payers_onboarding: "",

    user_name: user?.UserName || "",
    process: user?.process || "",
    subprocess: user?.subprocess || "",
    team: user?.team || "",

    created_by: user?.UserName || "",
    approved_by: "",
    approved_at: "",
    status: "Pending",
  });

  const fetchTargets = async () => {
    const requestData = {
      user_id: user.UserName,
      position: user.position,
      supervisor: user.MailAdress || null,
      process: user.process || null,
      subprocess: user.subprocess || null,
      team: user.team,

    };

    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/non-deposit-target/by-user`, requestData);
      setTargets(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["new_account", "unauthorized_transaction", "active_card_no", "eeu_transaction_count", "merchant_recruitment", "merchant_transaction_volume", "agent_recruitment", "agent_transaction_volume", "michu_unique_recruitment", "digital_transaction_volume", "coopay_ebirr_activation", "atm_crm_uptime_rate", "cash_balance_accuracy_rate", "pos_deployment", "avg_txn_per_cso", "compliance_rate", "reports_3days_rate", "audit_report_quality", "cash_surprise_checks", "employee_perf_threshold", "transaction_audit_rate", "gl", "customer_engagement", "new_customer_onboarding", "armingc_deposit_proportion", "coopapp_business_onboarding", "new_bill_payers_onboarding"].includes(name)) {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }
    setTarget({ ...target, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };
  const handleApprove = async (t) => {
    try {
      if (t.created_by === user.UserName) {
        toast.error("You cannot approve your own target");
        return;
      }
      setLoading(true);
      await axios.put(`${baseUrl}/non-deposit-target/approvenondepositTarget/${t.target_id}`, {
        approved_by: user.UserName,
        approved_at: new Date().toISOString(),
        status: "Approved",
      });
      toast.success("Target approved successfully");
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to approve target");
    } finally {
      setLoading(false);
    }
  };
  const validate = () => {
    const newErrors = {};
    if (!target.new_account) newErrors.new_account = "Required";
    if (!target.unauthorized_transaction) newErrors.unauthorized_transaction = "Required";
    if (!target.active_card_no) newErrors.active_card_no = "Required";
    if (!target.eeu_transaction_count) newErrors.eeu_transaction_count = "Required";
    if (!target.merchant_recruitment) newErrors.merchant_recruitment = "Required";
    if (!target.merchant_transaction_volume) newErrors.merchant_transaction_volume = "Required";
    if (!target.agent_recruitment) newErrors.agent_recruitment = "Required";
    if (!target.agent_transaction_volume) newErrors.agent_transaction_volume = "Required";
    if (!target.michu_unique_recruitment) newErrors.michu_unique_recruitment = "Required";
    if (!target.digital_transaction_volume) newErrors.digital_transaction_volume = "Required";
    if (!target.coopay_ebirr_activation) newErrors.coopay_ebirr_activation = "Required";
    if (!target.atm_crm_uptime_rate) newErrors.atm_crm_uptime_rate = "Required";
    if (!target.cash_balance_accuracy_rate) newErrors.cash_balance_accuracy_rate = "Required";
    if (!target.pos_deployment) newErrors.pos_deployment = "Required";
    if (!target.avg_txn_per_cso) newErrors.avg_txn_per_cso = "Required";
    if (!target.compliance_rate) newErrors.compliance_rate = "Required";
    if (!target.reports_3days_rate) newErrors.reports_3days_rate = "Required";
    if (!target.audit_report_quality) newErrors.audit_report_quality = "Required";
    if (!target.cash_surprise_checks) newErrors.cash_surprise_checks = "Required";
    if (!target.employee_perf_threshold) newErrors.employee_perf_threshold = "Required";
    if (!target.transaction_audit_rate) newErrors.transaction_audit_rate = "Required";
    if (!target.coopapp_business_onboarding) newErrors.coopapp_business_onboarding = "Required";
    if (!target.new_bill_payers_onboarding) newErrors.new_bill_payers_onboarding = "Required";

    if (target.active_card_no < 0) newErrors.active_card_no = "Target Must be Greater Than 0";
    if (target.eeu_transaction_count < 0) newErrors.eeu_transaction_count = "Target Must be Greater Than 0";
    if (target.merchant_recruitment < 0) newErrors.merchant_recruitment = "Target Must be Greater Than 0";
    if (target.merchant_transaction_volume < 0) newErrors.merchant_transaction_volume = "Target Must be Greater Than 0";
    if (target.agent_recruitment < 0) newErrors.agent_recruitment = "Target Must be Greater Than 0";
    if (target.agent_transaction_volume < 0) newErrors.agent_transaction_volume = "Target Must be Greater Than 0";
    if (target.michu_unique_recruitment < 0) newErrors.michu_unique_recruitment = "Target Must be Greater Than 0";
    if (target.digital_transaction_volume < 0) newErrors.digital_transaction_volume = "Target Must be Greater Than 0";
    if (target.coopay_ebirr_activation < 0) newErrors.coopay_ebirr_activation = "Target Must be Greater Than 0";
    if (target.atm_crm_uptime_rate < 0) newErrors.atm_crm_uptime_rate = "Target Must be Greater Than 0";
    if (target.cash_balance_accuracy_rate < 0) newErrors.cash_balance_accuracy_rate = "Target Must be Greater Than 0";
    if (target.pos_deployment < 0) newErrors.pos_deployment = "Target Must be Greater Than 0";
    if (target.avg_txn_per_cso < 0) newErrors.avg_txn_per_cso = "Target Must be Greater Than 0";
    if (target.compliance_rate < 0) newErrors.compliance_rate = "Target Must be Greater Than 0";
    if (target.reports_3days_rate < 0) newErrors.reports_3days_rate = "Target Must be Greater Than 0";
    if (target.audit_report_quality < 0) newErrors.audit_report_quality = "Target Must be Greater Than 0";
    if (target.cash_surprise_checks < 0) newErrors.cash_surprise_checks = "Target Must be Greater Than 0";
    if (target.employee_perf_threshold < 0) newErrors.employee_perf_threshold = "Target Must be Greater Than 0";
    if (target.transaction_audit_rate < 0) newErrors.transaction_audit_rate = "Target Must be Greater Than 0";
    if (target.customer_engagement < 0) newErrors.customer_engagement = "Target Must be Greater Than 0";
    if (target.new_customer_onboarding < 0) newErrors.new_customer_onboarding = "Target Must be Greater Than 0";
    if (target.armingc_deposit_proportion < 0) newErrors.armingc_deposit_proportion = "Target Must be Greater Than 0";
    if (target.gl < 0) newErrors.gl = "Target Must be Greater Than 0";
    if (target.coopapp_business_onboarding < 0) newErrors.coopapp_business_onboarding = "Target Must be Greater Than 0";
    if (target.new_bill_payers_onboarding < 0) newErrors.new_bill_payers_onboarding = "Target Must be Greater Than 0";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {

      setErrors(validationErrors);
      return;
    }
    // console.log("errors", errors);
    try {
      setLoading(true);
      if (target.target_id) {
        await axios.put(`${baseUrl}/non-deposit-target/${target.target_id}`, target);
        toast.success("Target updated successfully");
      } else {
        await axios.post(`${baseUrl}/non-deposit-target`, target);
        toast.success("Target added successfully");
      }
      setShowForm(false);
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save target");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
    setTarget({
      target_id: t.target_id,
      user_name: t.user_name || "",
      new_account: t.new_account || "",
      unauthorized_transaction: t.unauthorized_transaction || "",
      active_card_no: t.active_card_no || "",
      eeu_transaction_count: t.eeu_transaction_count || "",
      process: t.process || "",
      subprocess: t.subprocess || "",
      team: t.team || "",
      merchant_recruitment: t.merchant_recruitment || "",
      merchant_transaction_volume: t.merchant_transaction_volume || "",
      agent_recruitment: t.agent_recruitment || "",
      agent_transaction_volume: t.agent_transaction_volume || "",
      michu_unique_recruitment: t.michu_unique_recruitment || "",
      digital_transaction_volume: t.digital_transaction_volume || "",
      coopay_ebirr_activation: t.coopay_ebirr_activation || "",
      atm_crm_uptime_rate: t.atm_crm_uptime_rate || "",
      cash_balance_accuracy_rate: t.cash_balance_accuracy_rate || "",
      pos_deployment: t.pos_deployment || "",
      avg_txn_per_cso: t.avg_txn_per_cso || "",
      compliance_rate: t.compliance_rate || "",
      reports_3days_rate: t.reports_3days_rate || "",
      audit_report_quality: t.audit_report_quality || "",
      cash_surprise_checks: t.cash_surprise_checks || "",
      employee_perf_threshold: t.employee_perf_threshold || "",
      transaction_audit_rate: t.transaction_audit_rate || "",
      customer_engagement: t.customer_engagement || "",
      new_customer_onboarding: t.new_customer_onboarding || "",
      armingc_deposit_proportion: t.armingc_deposit_proportion || "",
      gl: t.gl || "",
      coopapp_business_onboarding: t.coopapp_business_onboarding || "",
      new_bill_payers_onboarding: t.new_bill_payers_onboarding || "",
      created_by: t.created_by || "",
      approved_by: t.approved_by || "",
      approved_at: t.approved_at || "",
      status: "Pending",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/non-deposit-target/${id}`);
      toast.success("Target deleted successfully");
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Non-Financial Targets
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Non-Financial Targets</Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setTarget({
              new_account: "",
              unauthorized_transaction: "",
              active_card_no: "",
              eeu_transaction_count: "",
              user_name: user?.UserName || "",
              process: user.process,
              subprocess: user.subprocess,
              team: user.team,
              merchant_recruitment: "",
              merchant_transaction_volume: "",
              agent_recruitment: "",
              agent_transaction_volume: "",
              michu_unique_recruitment: "",
              digital_transaction_volume: "",
              coopay_ebirr_activation: "",
              atm_crm_uptime_rate: "",
              cash_balance_accuracy_rate: "",
              pos_deployment: "",
              avg_txn_per_cso: "",
              compliance_rate: "",
              reports_3days_rate: "",
              audit_report_quality: "",
              cash_surprise_checks: "",
              employee_perf_threshold: "",
              transaction_audit_rate: "",
              customer_engagement: "",
              new_customer_onboarding: "",
              armingc_deposit_proportion: "",
              gl: "",
              coopapp_business_onboarding: "",
              new_bill_payers_onboarding: "",
              created_by: user?.UserName || "",
              approved_by: "",
              approved_at: "",
              status: "Pending",
            });
            setErrors({});
            setShowForm(true);
          }}
          Color="info"
        >
          Add Target
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ minWidth: 800 }}>
          <Table hover>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>New Account</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unauthorized Transaction</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Active Card</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>EEU Transaction</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Merchant Recruitment</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Merchant Transaction Volume</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Agent Recruitment</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Agent Transaction Volume</TableCell>
                {/* <TableCell sx={{ fontWeight: 600 }}>Michu Unique Recruitment</TableCell> */}
                <TableCell sx={{ fontWeight: 600 }}>Digital Transaction Volume</TableCell>
                {/* <TableCell sx={{ fontWeight: 600 }}>Coopay E-Birr Activation</TableCell> */}
                <TableCell sx={{ fontWeight: 600 }}>ATM CRM Uptime Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cash Balance Accuracy Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pos Deployment</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Avg Txn Per CSO</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Compliance Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reports 3 Days Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Audit Report Quality</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cash Surprise Checks</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employee Perf Threshold</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Transaction Audit Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer Engagement</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>New Customer Onboarding</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Arming C Deposit Proportion</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>GL</TableCell>
                {/* <TableCell sx={{ fontWeight: 600 }}>Coopapp Business Onboarding</TableCell> */}
                <TableCell sx={{ fontWeight: 600 }}>New Bill Payers Onboarding</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((t) => (
                <TableRow key={t.target_id} hover>
                  <TableCell>{t.user_name}</TableCell>
                  <TableCell>{t.new_account}</TableCell>
                  <TableCell>{t.unauthorized_transaction}</TableCell>
                  <TableCell>{t.active_card_no}</TableCell>
                  <TableCell>{t.eeu_transaction_count}</TableCell>
                  <TableCell>{t.merchant_recruitment}</TableCell>
                  <TableCell>{t.merchant_transaction_volume}</TableCell>
                  <TableCell>{t.agent_recruitment}</TableCell>
                  <TableCell>{t.agent_transaction_volume}</TableCell>
                  {/* <TableCell>{t.michu_unique_recruitment}</TableCell> */}
                  <TableCell>{t.digital_transaction_volume}</TableCell>
                  {/* <TableCell>{t.coopay_ebirr_activation}</TableCell> */}
                  <TableCell>{t.atm_crm_uptime_rate}</TableCell>
                  <TableCell>{t.cash_balance_accuracy_rate}</TableCell>
                  <TableCell>{t.pos_deployment}</TableCell>
                  <TableCell>{t.avg_txn_per_cso}</TableCell>
                  <TableCell>{t.compliance_rate}</TableCell>
                  <TableCell>{t.reports_3days_rate}</TableCell>
                  <TableCell>{t.audit_report_quality}</TableCell>
                  <TableCell>{t.cash_surprise_checks}</TableCell>
                  <TableCell>{t.employee_perf_threshold}</TableCell>
                  <TableCell>{t.transaction_audit_rate}</TableCell>
                  <TableCell>{t.customer_engagement}</TableCell>
                  <TableCell>{t.new_customer_onboarding}</TableCell>
                  <TableCell>{t.armingc_deposit_proportion}</TableCell>
                  <TableCell>{t.gl}</TableCell>
                  {/* <TableCell>{t.coopapp_business_onboarding}</TableCell> */}
                  <TableCell>{t.new_bill_payers_onboarding}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "12px",
                        backgroundColor:
                          t.status === "Approved"
                            ? "green"
                            : t.status === "Pending"
                              ? "orange"
                              : t.status === "Rejected"
                                ? "red"
                                : "gray",
                      }}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {(user.position === "Manager" || user.position === "Director" || user.position === "Senior Director" || user.position === "VP") && t.created_by !== user.UserName && t.status !== "Approved" && (
                        <Tooltip title="Approve">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleApprove(t)}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {t.created_by === user.UserName && t.status === "Pending" && (
                        <Tooltip title="Edit">
                          <IconButton color="primary" size="small" onClick={() => handleEdit(t)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>)}
                      {t.created_by === user.UserName && t.status === "Pending" && (
                        <Tooltip title="Delete">
                          <IconButton color="error" size="small" onClick={() => handleDelete(t.target_id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showForm}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {target.target_id ? "Edit Target Record" : "Add Target Record"}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Account Opening"
                    name="new_account"
                    type="number"
                    value={target.new_account}
                    onChange={handleChange}
                    error={!!errors.new_account}
                    helperText={errors.new_account}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Unauthorized Transaction Target"
                    name="unauthorized_transaction"
                    type="number"
                    value={target.unauthorized_transaction}
                    onChange={handleChange}
                    error={!!errors.unauthorized_transaction}
                    helperText={errors.unauthorized_transaction}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Active Card Target"
                    name="active_card_no"
                    type="number"
                    value={target.active_card_no}
                    onChange={handleChange}
                    error={!!errors.active_card_no}
                    helperText={errors.active_card_no}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="EEU Transaction Target"
                    name="eeu_transaction_count"
                    type="number"
                    value={target.eeu_transaction_count}
                    onChange={handleChange}
                    error={!!errors.eeu_transaction_count}
                    helperText={errors.eeu_transaction_count}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Merchant Recruitment"
                    name="merchant_recruitment"
                    type="number"
                    value={target.merchant_recruitment}
                    onChange={handleChange}
                    error={!!errors.merchant_recruitment}
                    helperText={errors.merchant_recruitment}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Merchant Transaction Volume"
                    name="merchant_transaction_volume"
                    type="number"
                    value={target.merchant_transaction_volume}
                    onChange={handleChange}
                    error={!!errors.merchant_transaction_volume}
                    helperText={errors.merchant_transaction_volume}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Agent Recruitment"
                    name="agent_recruitment"
                    type="number"
                    value={target.agent_recruitment}
                    onChange={handleChange}
                    error={!!errors.agent_recruitment}
                    helperText={errors.agent_recruitment}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Agent Transaction Volume"
                    name="agent_transaction_volume"
                    type="number"
                    value={target.agent_transaction_volume}
                    onChange={handleChange}
                    error={!!errors.agent_transaction_volume}
                    helperText={errors.agent_transaction_volume}
                    size="small"
                  />
                </Grid>
                {/* <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Michu Unique Recruitment"
                    name="michu_unique_recruitment"
                    type="number"
                    value={target.michu_unique_recruitment}
                    onChange={handleChange}
                    error={!!errors.michu_unique_recruitment}
                    helperText={errors.michu_unique_recruitment}
                    size="small"
                  />
                </Grid> */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Digital Transaction Volume"
                    name="digital_transaction_volume"
                    type="number"
                    value={target.digital_transaction_volume}
                    onChange={handleChange}
                    error={!!errors.digital_transaction_volume}
                    helperText={errors.digital_transaction_volume}
                    size="small"
                  />
                </Grid>
                {/* <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coopay/EBirr Activation"
                    name="coopay_ebirr_activation"
                    type="number"
                    value={target.coopay_ebirr_activation}
                    onChange={handleChange}
                    error={!!errors.coopay_ebirr_activation}
                    helperText={errors.coopay_ebirr_activation}
                    size="small"
                  />
                </Grid> */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ATM/CRM Uptime Rate"
                    name="atm_crm_uptime_rate"
                    type="number"
                    value={target.atm_crm_uptime_rate}
                    onChange={handleChange}
                    error={!!errors.atm_crm_uptime_rate}
                    helperText={errors.atm_crm_uptime_rate}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cash Balance Accuracy Rate"
                    name="cash_balance_accuracy_rate"
                    type="number"
                    value={target.cash_balance_accuracy_rate}
                    onChange={handleChange}
                    error={!!errors.cash_balance_accuracy_rate}
                    helperText={errors.cash_balance_accuracy_rate}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Pos Deployment"
                    name="pos_deployment"
                    type="number"
                    value={target.pos_deployment}
                    onChange={handleChange}
                    error={!!errors.pos_deployment}
                    helperText={errors.pos_deployment}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Avg Txn Per CSO"
                    name="avg_txn_per_cso"
                    type="number"
                    value={target.avg_txn_per_cso}
                    onChange={handleChange}
                    error={!!errors.avg_txn_per_cso}
                    helperText={errors.avg_txn_per_cso}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Compliance Rate"
                    name="compliance_rate"
                    type="number"
                    value={target.compliance_rate}
                    onChange={handleChange}
                    error={!!errors.compliance_rate}
                    helperText={errors.compliance_rate}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Reports 3 Days Rate"
                    name="reports_3days_rate"
                    type="number"
                    value={target.reports_3days_rate}
                    onChange={handleChange}
                    error={!!errors.reports_3days_rate}
                    helperText={errors.reports_3days_rate}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Audit Report Quality"
                    name="audit_report_quality"
                    type="number"
                    value={target.audit_report_quality}
                    onChange={handleChange}
                    error={!!errors.audit_report_quality}
                    helperText={errors.audit_report_quality}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cash Surprise Checks"
                    name="cash_surprise_checks"
                    type="number"
                    value={target.cash_surprise_checks}
                    onChange={handleChange}
                    error={!!errors.cash_surprise_checks}
                    helperText={errors.cash_surprise_checks}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee Perf Threshold"
                    name="employee_perf_threshold"
                    type="number"
                    value={target.employee_perf_threshold}
                    onChange={handleChange}
                    error={!!errors.employee_perf_threshold}
                    helperText={errors.employee_perf_threshold}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Transaction Audit Rate"
                    name="transaction_audit_rate"
                    type="number"
                    value={target.transaction_audit_rate}
                    onChange={handleChange}
                    error={!!errors.transaction_audit_rate}
                    helperText={errors.transaction_audit_rate}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Engagement"
                    name="customer_engagement"
                    type="number"
                    value={target.customer_engagement}
                    onChange={handleChange}
                    error={!!errors.customer_engagement}
                    helperText={errors.customer_engagement}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Customer Onboarding"
                    name="new_customer_onboarding"
                    type="number"
                    value={target.new_customer_onboarding}
                    onChange={handleChange}
                    error={!!errors.new_customer_onboarding}
                    helperText={errors.new_customer_onboarding}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Arming C Deposit Proportion"
                    name="armingc_deposit_proportion"
                    type="number"
                    value={target.armingc_deposit_proportion}
                    onChange={handleChange}
                    error={!!errors.armingc_deposit_proportion}
                    helperText={errors.armingc_deposit_proportion}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GL"
                    name="gl"
                    type="number"
                    value={target.gl}
                    onChange={handleChange}
                    error={!!errors.gl}
                    helperText={errors.gl}
                    size="small"
                  />
                </Grid>
                {/* <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coopapp Business Onboarding"
                    name="coopapp_business_onboarding"
                    type="number"
                    value={target.coopapp_business_onboarding}
                    onChange={handleChange}
                    error={!!errors.coopapp_business_onboarding}
                    helperText={errors.coopapp_business_onboarding}
                    size="small"
                  />
                </Grid> */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Bill Payers Onboarding"
                    name="new_bill_payers_onboarding"
                    type="number"
                    value={target.new_bill_payers_onboarding}
                    onChange={handleChange}
                    error={!!errors.new_bill_payers_onboarding}
                    helperText={errors.new_bill_payers_onboarding}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="User"
                    value={user?.FullName || ""}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="contained" Color="info">
                  {target.target_id ? "Update Target" : "Save Target"}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Loading Overlay */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default NonDepositTargetList;
