import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  LinearProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FlagIcon from "@mui/icons-material/Flag";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];

const MyDashboard = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState([]);
  const [overallAverage, setOverallAverage] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  // Exactly mirrors PerformanceMetricList.js fetchDataforsystemcalculate
  const fetchSystemData = async (type, requestData, targetsCache) => {
    try {
      const {
        targetRes, LoantargetRes, cashTargetRes,
        userNonDepositTargetRes, atmEeuDigitalTargetRes
      } = targetsCache;

      const totalDeposit = Number(targetRes.data?.total_deposit) || 0;
      const totalFcyTarget = Number(targetRes.data?.total_fcy) || 0;
      let totalLoanTarget = 0;
      if (requestData.process === "Interest Free Banking" || requestData.process === "Agri and Cooperative Business" || (requestData.process === "Growth and Operations" && requestData.organization === "Ho")) {
        totalLoanTarget = Number(targetRes.data?.total_loan) || 0;
      } else {
        totalLoanTarget = Number(LoantargetRes.data?.loan_collection) || 0;
      }
      const cash_collectionTarget = Number(cashTargetRes.data?.cash_collection) || 0;
      const cash_deposited_crmTarget = Number(cashTargetRes.data?.cash_deposited_crm) || 0;
      const newAccountTarget = userNonDepositTargetRes.data?.total_new_account || 0;
      const unauthorizeTransTarget = userNonDepositTargetRes.data?.total_unauthorized || 0;
      const active_cardTarget = userNonDepositTargetRes.data?.active_card || 0;
      const transaction_audit_rateTarget = userNonDepositTargetRes.data?.transaction_audit_rate || 0;
      const merchant_transaction_volumeTarget = userNonDepositTargetRes.data?.merchant_transaction_volume || 0;
      const agent_transaction_volumeTarget = userNonDepositTargetRes.data?.agent_transaction_volume || 0;
      const merchant_recruitmentTarget = userNonDepositTargetRes.data?.merchant_recruitment || 0;
      const agent_recruitmentTarget = userNonDepositTargetRes.data?.agent_recruitment || 0;
      const coopay_ebirr_activationTarget = userNonDepositTargetRes.data?.coopay_ebirr_activation || 0;
      const michu_unique_recruitmentTarget = userNonDepositTargetRes.data?.michu_unique_recruitment || 0;
      const avg_txn_per_csoTarget = userNonDepositTargetRes.data?.avg_txn_per_cso || 0;
      const gl = userNonDepositTargetRes.data?.gl || 0;
      const customer_engagementTarget = userNonDepositTargetRes.data?.customer_engagement || 0;
      const new_customer_onboardingTarget = userNonDepositTargetRes.data?.new_customer_onboarding || 0;
      const cash_balance_accuracy_rateTarget = userNonDepositTargetRes.data?.cash_balance_accuracy_rate || 0;
      const zero_customer_complaintsTarget = userNonDepositTargetRes.data?.zero_customer_complaints || 0;
      const compliance_rateTarget = userNonDepositTargetRes.data?.compliance_rate || 0;
      const reports_3days_rateTarget = userNonDepositTargetRes.data?.reports_3days_rate || 0;
      const audit_report_qualityTarget = userNonDepositTargetRes.data?.audit_report_quality || 0;
      const cash_surprise_checksTarget = userNonDepositTargetRes.data?.cash_surprise_checks || 0;
      const eeu_transactionTarget = atmEeuDigitalTargetRes.data?.eeu_transaction || 0;
      const digital_transaction_volumeTarget = atmEeuDigitalTargetRes.data?.digital_transaction_volume || 0;
      const atm_crm_uptime_rateTarget = atmEeuDigitalTargetRes.data?.atm_crm_uptime_rate || 0;
      const employee_perf_thresholdTarget = atmEeuDigitalTargetRes.data?.employee_perf_threshold || 0;

      if (type === "deposit" && totalDeposit > 0) {
        let accountBalance = 0;
        if (requestData.position === "Manager" && requestData.organization === "Branch") {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData);
          accountBalance = Number(r.data?.local_deposit) || 0;
        } else if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData);
          accountBalance = Number(r.data?.local_deposit) || 0;
        } else {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifference/`, requestData);
          accountBalance = Number(r.data?.total_difference) || 0;
        }
        return { actual: accountBalance, target: totalDeposit };
      }

      if (type === "fcy" && totalFcyTarget > 0) {
        let fcyBalance = 0;
        if (requestData.position === "Manager" && requestData.organization === "Branch") {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData);
          fcyBalance = Number(r.data?.fcy) || 0;
        } else if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData);
          fcyBalance = Number(r.data?.fcy) || 0;
        } else {
          const r = await axios.post(`${baseUrl}/fcy/fcyBalanceDifferenceByUserMapped`, requestData);
          fcyBalance = Number(r.data?.total_difference) || 0;
        }
        return { actual: fcyBalance, target: totalFcyTarget };
      }

      if (type === "loan" && totalLoanTarget > 0) {
        let loanActual = 0;
        if (requestData.process === "Interest Free Banking" || requestData.process === "Agri and Cooperative Business" || (requestData.process === "Growth and Operations" && requestData.organization === "Ho")) {
          const r = await axios.post(`${baseUrl}/loan/loanBalanceDifferenceMapped`, requestData);
          loanActual = Number(r.data?.total_difference) || 0;
        } else {
          const r = await axios.post(`${baseUrl}/loan/loanBalanceDifference`, requestData);
          loanActual = Number(r.data?.total_difference) || 0;
        }
        return { actual: loanActual, target: totalLoanTarget };
      }

      if (type === "Cash Collection" && cash_collectionTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getCashDepositbyBranchSummaryByUser`, requestData);
        return { actual: Number(r.data?.total_cash_collection) || 0, target: cash_collectionTarget };
      }

      if (type === "CRM Deposit" && cash_deposited_crmTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getCRMCashDepositSummaryByUser/`, requestData);
        return { actual: Number(r.data?.total_crm_cash) || 0, target: cash_deposited_crmTarget };
      }

      if (type === "account" && newAccountTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/new-accounts-summary/`, requestData);
        return { actual: r.data?.total_accounts || 0, target: newAccountTarget };
      }

      if (type === "Transaction" && unauthorizeTransTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/non-txn-summary/`, requestData);
        return { actual: r.data?.total_unauthorized || 0, target: unauthorizeTransTarget };
      }

      if (type === "card" && active_cardTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/activecard/`, requestData);
        return { actual: r.data?.total_active_card_users || 0, target: active_cardTarget };
      }

      if (type === "EEU" && eeu_transactionTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/eeutransaction/`, requestData);
        return { actual: r.data?.total_txn_count || 0, target: eeu_transactionTarget };
      }

      if (type === "Transaction Audit" && transaction_audit_rateTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getAuditedTxnSummaryByUser/`, requestData);
        return { actual: r.data?.total_audited_txn_count || 0, target: transaction_audit_rateTarget };
      }

      if (type === "Digital Transaction" && digital_transaction_volumeTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getDigitalTxnPercentageSummaryByUser/`, requestData);
        return { actual: r.data?.digital_txn_percentage || 0, target: digital_transaction_volumeTarget };
      }

      if (type === "Customer Engagement" && customer_engagementTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getCustomerEngagementSummaryByUser/`, requestData);
        return { actual: r.data?.total_customer_engagement || 0, target: customer_engagementTarget };
      }

      if (type === "New Customer Onboarding" && new_customer_onboardingTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getNewCustomerOnboardingSummaryByUser/`, requestData);
        return { actual: r.data?.total_new_customer_onboarding || 0, target: new_customer_onboardingTarget };
      }

      if (type === "Merchant Transaction Volume" && merchant_transaction_volumeTarget > 0) {
        if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData);
          return { actual: Number(r.data?.merchant_transaction_volume) || 0, target: merchant_transaction_volumeTarget };
        }
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData);
        return { actual: Number(r.data?.merchant_transaction_volume) || 0, target: merchant_transaction_volumeTarget };
      }

      if (type === "Agent Transaction Volume" && agent_transaction_volumeTarget > 0) {
        if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
          const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData);
          return { actual: Number(r.data?.agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
        }
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData);
        return { actual: Number(r.data?.agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
      }

      if (type === "Avg Txn Per CSO" && avg_txn_per_csoTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getCsoTransactionPerformance/`, requestData);
        return { actual: r.data?.total_accomplishment_percentage || 0, target: avg_txn_per_csoTarget };
      }

      if (type === "GL" && gl > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getBranchInternalAccountsSummary/`, requestData);
        return { actual: r.data?.internal_account_value || 0, target: gl };
      }

      if (type === "SPM") {
        const r1 = await axios.post(`${baseUrl}/loanaccountmapping/getSpecialMentionLoanSumBalanceByUser`, requestData);
        const r2 = await axios.post(`${baseUrl}/loanaccountmapping/getLoanOutstandingBalanceByUser`, requestData);
        return { actual: r1.data?.total_balance || 0, target: r2.data?.total_balance || 0 };
      }

      if (type === "District Map") {
        const r = await axios.post(`${baseUrl}/districtmapping/getMappedDistrictsByUser/${requestData.user_id}`);
        if (r.data?.length > 0) {
          const dr = await axios.post(`${baseUrl}/districtmapping/getTargetsAndDepositByDistricts`, { districts: r.data.map(i => i.district_name) });
          const totals = dr.data.reduce((acc, item) => ({ target: acc.target + (Number(item.total_deposit_target) || 0), actual: acc.actual + (Number(item.balance_difference) || 0) }), { actual: 0, target: 0 });
          return totals;
        }
        return { actual: 0, target: 0 };
      }

      if (type === "Branch Vital") {
        const r = await axios.post(`${baseUrl}/branchvital/branch-vital-summary`, requestData);
        return { actual: r.data?.OUT_OF_100 || 0, target: 100 };
      }

      // User-input metrics (no system actual)
      if (type === "Merchant Recruitment") return { actual: null, target: merchant_recruitmentTarget };
      if (type === "Agent Recruitment") return { actual: null, target: agent_recruitmentTarget };
      if (type === "Michu Unique Recruitment") return { actual: null, target: michu_unique_recruitmentTarget };
      if (type === "Coopay Ebirr Activation") return { actual: null, target: coopay_ebirr_activationTarget };
      if (type === "ATM CRM Uptime Rate") return { actual: null, target: atm_crm_uptime_rateTarget };
      if (type === "Cash Book") return { actual: null, target: cash_balance_accuracy_rateTarget };
      if (type === "Customer Satisfaction") return { actual: null, target: zero_customer_complaintsTarget };
      if (type === "Branch Compliance") return { actual: null, target: compliance_rateTarget };
      if (type === "Audit Report") return { actual: null, target: reports_3days_rateTarget };
      if (type === "Audit Quality") return { actual: null, target: audit_report_qualityTarget };
      if (type === "Cash Surprise Cheque") return { actual: null, target: cash_surprise_checksTarget };
      if (type === "Employee Performance") return { actual: null, target: employee_perf_thresholdTarget };

      return { actual: 0, target: 0 };
    } catch (err) {
      console.error("fetchSystemData error:", err);
      return { actual: 0, target: 0 };
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Step 1: Fetch full user profile using username (for requestData fields)
      const userRes = await axios.get(`${baseUrl}/users/getUserByuserName/${encodeURIComponent(user.UserName)}`);
      const info = userRes.data || {};
      setUserInfo(info);

      // Step 2: Fetch employee record for title and branch_grade (lives in employees table)
      let title = user.position || "";
      let branch_grade = "";
      try {
        const empRes = await axios.get(`${baseUrl}/employees/title/email`, {
          params: { email: user.MailAdress },
        });
        title = empRes.data?.title_name || user.position || "";
        branch_grade = empRes.data?.branch_grade || "";
      } catch (empErr) {
        console.warn("Could not fetch employee title info:", empErr.message);
      }

      // Step 2: Fetch assigned metrics by title + branch_grade
      const metricRes = await axios.get(
        `${baseUrl}/performances/bytitleName/${encodeURIComponent(title)}/${encodeURIComponent(branch_grade)}`
      );
      const assignedMetrics = metricRes.data || [];

      if (assignedMetrics.length === 0) {
        toast.info("No metrics assigned to your profile.");
        setLoading(false);
        return;
      }

      // Step 3: Build requestData from userinfo (same as PerformanceMetricList.js)
      const requestData = {
        user_id: info.user_name || user.UserName,
        username: info.user_name || user.UserName,
        user_name: info.user_name || user.UserName,
        position: info.position || user.position,
        process: info.process || null,
        subprocess: info.subprocess || null,
        team: info.team || null,
        cbsusername: info.cbsusername || null,
        company_code: info.company_code,
        organization: info.organization || null,
      };

      // Step 4: Pre-fetch all targets at once (batch)
      const [targetRes, LoantargetRes, cashTargetRes, userNonDepositTargetRes, atmEeuDigitalTargetRes] = await Promise.all([
        axios.post(`${baseUrl}/targets/TargetsSummary/`, requestData),
        axios.post(`${baseUrl}/targets/loanCollectionTargetByUser/`, requestData),
        axios.post(`${baseUrl}/targets/cashCollectionTargetByUser/`, requestData),
        axios.post(`${baseUrl}/non-deposit-target/summary/`, requestData),
        axios.post(`${baseUrl}/non-deposit-target/atm-eeu-digital/`, requestData),
      ]);

      const targetsCache = { targetRes, LoantargetRes, cashTargetRes, userNonDepositTargetRes, atmEeuDigitalTargetRes };

      // Quarter progress
      const startDate = new Date("2026-04-01");
      const today = new Date();
      let daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      daysPassed = Math.max(0, Math.min(daysPassed, 90));
      const quarterRatio = daysPassed / 90;

      // Step 5: For each assigned metric, resolve type and fetch data
      const ICON_MAP = {
        deposit: "💰", fcy: "💱", loan: "⚖️", account: "📈",
        transaction: "📉", card: "💳", eeu: "💡",
        "merchant transaction volume": "🏪", "agent transaction volume": "🧑‍💼",
        "employee performance": "⭐", "merchant recruitment": "🤝",
        "agent recruitment": "🤝", "cash collection": "💵",
        "crm deposit": "🏦", gl: "📋", "branch vital": "🌿",
        "district map": "🗺️", "digital transaction": "📱",
        "transaction audit": "🔍", "customer engagement": "👥",
        "new customer onboarding": "🆕", spm: "📊",
        "avg txn per cso": "🧾", "atm crm uptime rate": "🖥️",
        "employee performance": "⭐", default: "📊"
      };

      const TYPE_MAP = {
        deposit: "deposit", fcy: "fcy", loan: "loan", account: "account",
        transaction: "Transaction", card: "card", eeu: "EEU",
        "merchant transaction volume": "Merchant Transaction Volume",
        "agent transaction volume": "Agent Transaction Volume",
        "employee performance": "Employee Performance",
        "merchant recruitment": "Merchant Recruitment",
        "agent recruitment": "Agent Recruitment",
        "cash collection": "Cash Collection",
        "crm deposit": "CRM Deposit",
        "transaction audit": "Transaction Audit",
        "digital transaction": "Digital Transaction",
        "customer engagement": "Customer Engagement",
        "new customer onboarding": "New Customer Onboarding",
        "avg txn per cso": "Avg Txn Per CSO",
        "atm crm uptime rate": "ATM CRM Uptime Rate",
        gl: "GL", spm: "SPM", "branch vital": "Branch Vital",
        "district map": "District Map",
        "michu unique recruitment": "Michu Unique Recruitment",
        "coopay ebirr activation": "Coopay Ebirr Activation",
        "cash book": "Cash Book",
        "customer satisfaction": "Customer Satisfaction",
        "branch compliance": "Branch Compliance",
        "audit report": "Audit Report",
        "audit quality": "Audit Quality",
        "cash surprise cheque": "Cash Surprise Cheque",
        "armingc deposit proportion": "Armingc Deposit Proportion",
      };

      const metricsPromises = assignedMetrics.map(async (metric) => {
        const calcFor = metric.calculated_for?.toLowerCase().trim() || "";
        const type = TYPE_MAP[calcFor] || calcFor;
        const icon = ICON_MAP[calcFor] || ICON_MAP.default;
        const isUserInput = metric.input_by === "User";

        let actual = 0;
        let target = 0;

        if (isUserInput) {
          // For user-input metrics, only fetch the target, actual starts as null (user fills)
          const result = await fetchSystemData(type, requestData, targetsCache);
          target = (result.target || 0) * quarterRatio;
          actual = null; // user will fill
        } else {
          const result = await fetchSystemData(type, requestData, targetsCache);
          // For ratio-based targets, apply quarterRatio to expected
          target = (result.target || 0) * quarterRatio;
          actual = result.actual || 0;
        }

        const rate = target > 0 && actual !== null ? (actual / target) * 100 : 0;

        return {
          name: metric.metric_name || metric.calculated_for || "Metric",
          calcFor: calcFor,
          expected: target,
          actual: actual,
          rate: rate,
          icon: icon,
          inputBy: isUserInput ? "User" : "System",
          weight: metric.metric_weight || 0,
        };
      });

      const resolved = await Promise.all(metricsPromises);
      setMetricsData(resolved);

      const validMetrics = resolved.filter(m => m.actual !== null);
      const avg = validMetrics.length > 0
        ? validMetrics.reduce((s, m) => s + m.rate, 0) / validMetrics.length
        : 0;
      setOverallAverage(avg);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load your dashboard metrics. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleManualInput = (index, val) => {
    const updated = [...metricsData];
    const num = parseFloat(val) || 0;
    updated[index] = {
      ...updated[index],
      actual: num,
      rate: updated[index].expected > 0 ? (num / updated[index].expected) * 100 : 0,
    };
    setMetricsData(updated);

    const valid = updated.filter(m => m.actual !== null && m.inputBy === "System" || (m.inputBy === "User" && m.actual !== null));
    const avg = valid.length > 0
      ? updated.reduce((s, m) => s + (m.actual !== null ? m.rate : 0), 0) / updated.length
      : 0;
    setOverallAverage(avg);
  };

  const getStatusColor = (rate) => {
    if (rate >= 100) return "#10b981";
    if (rate >= 80) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusLabel = (rate) => {
    if (rate >= 100) return "Excellent";
    if (rate >= 80) return "On Track";
    return "Needs Attention";
  };

  const chartData = metricsData
    .filter(m => m.actual !== null)
    .map(m => ({
      name: m.name.length > 12 ? m.name.substring(0, 12) + "…" : m.name,
      fullName: m.name,
      Expected: parseFloat(m.expected.toFixed(2)),
      Actual: parseFloat((m.actual || 0).toFixed(2)),
    }));

  const pieData = metricsData
    .filter(m => m.actual !== null && m.expected > 0)
    .map(m => ({
      name: m.name,
      value: parseFloat(Math.min(m.rate, 150).toFixed(1)),
    }));

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: 2 }}>
        <CircularProgress size={56} thickness={4} sx={{ color: "#3b82f6" }} />
        <Typography variant="body1" color="text.secondary">Loading your performance dashboard…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 3 }, background: "linear-gradient(135deg, #f0f4ff 0%, #f9fafb 100%)" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex" }}>
            <AssessmentIcon sx={{ color: "#fff", fontSize: "1.6rem" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="800" color="#1e293b">
              My Performance Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              {userInfo?.title || user?.position || "Employee"} · Current Financial Quarter (Apr – Jun 2026)
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0eaff", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "#bfdbfe", color: "#1d4ed8", width: 52, height: 52 }}>
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="overline" sx={{ color: "#1e40af", fontWeight: 700, lineHeight: 1 }}>Overall Achievement</Typography>
                  <Typography variant="h4" fontWeight="900" color="#1e3a8a">{overallAverage.toFixed(1)}%</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(overallAverage, 100)}
                    sx={{ mt: 0.5, height: 5, borderRadius: 4, bgcolor: "#bfdbfe", "& .MuiLinearProgress-bar": { bgcolor: "#1d4ed8", borderRadius: 4 } }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #d1fae5", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "#bbf7d0", color: "#15803d", width: 52, height: 52 }}>
                  <EmojiEventsIcon />
                </Avatar>
                <Box>
                  <Typography variant="overline" sx={{ color: "#166534", fontWeight: 700, lineHeight: 1 }}>Metrics Assigned</Typography>
                  <Typography variant="h4" fontWeight="900" color="#14532d">{metricsData.length}</Typography>
                  <Typography variant="caption" color="#15803d">
                    {metricsData.filter(m => m.inputBy === "System").length} System · {metricsData.filter(m => m.inputBy === "User").length} Self-report
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e9d5ff", background: "linear-gradient(135deg, #fdf4ff, #fae8ff)", height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "#f5d0fe", color: "#a21caf", width: 52, height: 52, fontSize: "1.4rem" }}>
                  {overallAverage >= 100 ? "🏆" : overallAverage >= 80 ? "✅" : "⚠️"}
                </Avatar>
                <Box>
                  <Typography variant="overline" sx={{ color: "#86198f", fontWeight: 700, lineHeight: 1 }}>Current Status</Typography>
                  <Typography variant="h5" fontWeight="900" color="#701a75" sx={{ mt: 0.5 }}>{getStatusLabel(overallAverage)}</Typography>
                  <Chip
                    label={`${metricsData.filter(m => m.rate >= 100).length} metrics at 100%+`}
                    size="small"
                    sx={{ mt: 0.5, fontWeight: 700, bgcolor: "#f3e8ff", color: "#7e22ce" }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      {chartData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="800" color="#1e293b" sx={{ mb: 2.5 }}>
                  Actual vs Expected Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 13 }}
                      labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 16, fontSize: 13 }} />
                    <Bar dataKey="Expected" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar dataKey="Actual" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="800" color="#1e293b" sx={{ mb: 2.5 }}>
                  Achievement Share
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" nameKey="name">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 13 }}
                      formatter={(v, n) => [`${v}%`, n]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Metrics Cards */}
      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b">Metrics Breakdown</Typography>
            <Chip label="Self-report metrics are editable" icon={<EditIcon sx={{ fontSize: "14px !important" }} />} size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }} />
          </Stack>

          <Grid container spacing={2.5}>
            {metricsData.map((metric, idx) => (
              <Grid item xs={12} sm={6} xl={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: "1px solid",
                    borderColor: metric.inputBy === "User" ? "#fde68a" : "#e2e8f0",
                    borderRadius: 3,
                    background: metric.inputBy === "User"
                      ? "linear-gradient(135deg, #fffbeb, #fef9ee)"
                      : "linear-gradient(135deg, #f8fafc, #fff)",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      borderColor: getStatusColor(metric.rate),
                    },
                  }}
                >
                  {/* Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography sx={{ fontSize: "1.8rem", lineHeight: 1 }}>{metric.icon}</Typography>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="800" color="#1e293b" sx={{ lineHeight: 1.3 }}>
                          {metric.name}
                        </Typography>
                        <Chip
                          label={metric.inputBy === "User" ? "Self Report" : "System"}
                          size="small"
                          icon={metric.inputBy === "User" ? <EditIcon sx={{ fontSize: "10px !important" }} /> : <CheckCircleIcon sx={{ fontSize: "10px !important" }} />}
                          sx={{
                            height: 18, fontSize: "0.65rem", fontWeight: 700,
                            bgcolor: metric.inputBy === "User" ? "#fef3c7" : "#eff6ff",
                            color: metric.inputBy === "User" ? "#92400e" : "#1d4ed8",
                            mt: 0.3,
                          }}
                        />
                      </Box>
                    </Stack>
                    <Chip
                      label={metric.actual !== null ? `${metric.rate.toFixed(1)}%` : "—"}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        color: "#fff",
                        bgcolor: metric.actual !== null ? getStatusColor(metric.rate) : "#94a3b8",
                        borderRadius: 2,
                        minWidth: 52,
                        fontSize: "0.78rem",
                      }}
                    />
                  </Stack>

                  {/* Progress bar */}
                  <Box sx={{ mb: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                      <Typography variant="caption" fontWeight="700" color="#64748b">Progress</Typography>

                      {metric.inputBy === "User" ? (
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <Tooltip title="Enter your actual value to simulate performance" placement="top">
                            <input
                              type="number"
                              min="0"
                              value={metric.actual !== null ? metric.actual : ""}
                              onChange={(e) => handleManualInput(idx, e.target.value)}
                              placeholder="Enter actual"
                              style={{
                                width: 90,
                                padding: "3px 8px",
                                border: "1.5px solid #fbbf24",
                                borderRadius: 6,
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                outline: "none",
                                background: "#fffdf0",
                                color: "#78350f",
                              }}
                            />
                          </Tooltip>
                          <Typography variant="caption" color="#78350f" fontWeight="700">
                            / {metric.expected > 0 ? metric.expected.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "N/A"}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="#64748b" fontWeight="600">
                          {(metric.actual || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          {" / "}
                          {metric.expected > 0 ? metric.expected.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "N/A"}
                        </Typography>
                      )}
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={metric.actual !== null ? Math.min(metric.rate, 100) : 0}
                      sx={{
                        height: 7,
                        borderRadius: 4,
                        bgcolor: "#f1f5f9",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: metric.actual !== null ? getStatusColor(metric.rate) : "#cbd5e1",
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  {/* Weight */}
                  {metric.weight > 0 && (
                    <Typography variant="caption" color="#94a3b8" fontWeight="600">
                      Weight: {metric.weight}%
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {metricsData.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" color="text.secondary" fontWeight={600}>No metrics found for your profile</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please contact your administrator to assign metrics to your title.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MyDashboard;
