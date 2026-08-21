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
  Divider,
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
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];

// Animated radial gauge for overall score
const ScoreGauge = ({ value }) => {
  const capped = Math.min(value, 100);
  const radius = 70;
  const stroke = 10;
  const normalizedR = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedR;
  const strokeDashoffset = circumference - (capped / 100) * circumference;
  const color = value >= 100 ? "#10b981" : value >= 80 ? "#f59e0b" : "#ef4444";

  return (
    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={radius * 2} height={radius * 2} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={radius} cy={radius} r={normalizedR} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle
          cx={radius} cy={radius} r={normalizedR} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <Box sx={{ position: "absolute", textAlign: "center" }}>
        <Typography variant="h4" fontWeight="900" sx={{ color: "#fff", lineHeight: 1 }}>
          {value.toFixed(1)}%
        </Typography>
      </Box>
    </Box>
  );
};

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
      const michu_loan_collectionTarget = Number(cashTargetRes.data?.michu_loan_collection) || 0;
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
      const pos_deploymentTarget = userNonDepositTargetRes.data?.pos_deployment || 0;
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

      if (type === "CRM Deposit" && michu_loan_collectionTarget > 0) {
        const r = await axios.post(`${baseUrl}/nondeposit/getCRMCashDepositSummaryByUser/`, requestData);
        return { actual: Number(r.data?.total_crm_cash) || 0, target: michu_loan_collectionTarget };
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
      if (type === "Customer Satisfaction") return { actual: null, target: pos_deploymentTarget };
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
      const userRes = await axios.get(`${baseUrl}/users/getUserByuserName/${encodeURIComponent(user.UserName)}`);
      const info = userRes.data || {};
      setUserInfo(info);

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

      const metricRes = await axios.get(
        `${baseUrl}/performances/bytitleName/${encodeURIComponent(title)}/${encodeURIComponent(branch_grade)}`
      );
      const assignedMetrics = metricRes.data || [];

      if (assignedMetrics.length === 0) {
        toast.info("No metrics assigned to your profile.");
        setLoading(false);
        return;
      }

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

      const [targetRes, LoantargetRes, cashTargetRes, userNonDepositTargetRes, atmEeuDigitalTargetRes] = await Promise.all([
        axios.post(`${baseUrl}/targets/TargetsSummary/`, requestData),
        axios.post(`${baseUrl}/targets/loanCollectionTargetByUser/`, requestData),
        axios.post(`${baseUrl}/targets/cashCollectionTargetByUser/`, requestData),
        axios.post(`${baseUrl}/non-deposit-target/summary/`, requestData),
        axios.post(`${baseUrl}/non-deposit-target/atm-eeu-digital/`, requestData),
      ]);

      const targetsCache = { targetRes, LoantargetRes, cashTargetRes, userNonDepositTargetRes, atmEeuDigitalTargetRes };
      const startDate = new Date("2026-07-01");
      const today = new Date();
      let daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      daysPassed = Math.max(0, Math.min(daysPassed, 90));
      const quarterRatio = daysPassed / 90;

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
        default: "📊"
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
          const result = await fetchSystemData(type, requestData, targetsCache);
          target = (result.target || 0) * quarterRatio;
          actual = null;
        } else {
          const result = await fetchSystemData(type, requestData, targetsCache);
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

  const getStatusGradient = (rate) => {
    if (rate >= 100) return "linear-gradient(135deg, #059669, #10b981)";
    if (rate >= 80) return "linear-gradient(135deg, #d97706, #f59e0b)";
    return "linear-gradient(135deg, #dc2626, #ef4444)";
  };

  const chartData = metricsData
    .filter(m => m.actual !== null)
    .map(m => ({
      name: m.name.length > 12 ? m.name.substring(0, 12) + "…" : m.name,
      fullName: m.name,
      Expected: parseFloat(Number(m.expected).toFixed(2)),
      Actual: parseFloat(Number(m.actual || 0).toFixed(2)),
    }));

  const pieData = metricsData
    .filter(m => m.actual !== null && m.expected > 0)
    .map(m => ({
      name: m.name.length > 12 ? m.name.substring(0, 12) + "…" : m.name,
      fullName: m.name,
      value: parseFloat(Math.min(Number(m.rate), 150).toFixed(1)),
    }));

  const excellentCount = metricsData.filter(m => m.rate >= 100).length;
  const onTrackCount = metricsData.filter(m => m.rate >= 80 && m.rate < 100).length;
  const needsAttentionCount = metricsData.filter(m => m.rate < 80 && m.actual !== null).length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: 3 }}>
        <Box sx={{
          position: "relative", display: "inline-flex",
          "&::before": {
            content: '""', position: "absolute", inset: -8,
            borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            animation: "spin 2s linear infinite", opacity: 0.2,
          }
        }}>
          <CircularProgress size={64} thickness={3} sx={{ color: "#6366f1" }} />
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" fontWeight="700" color="#1e293b">Loading Dashboard</Typography>
          <Typography variant="body2" color="#64748b" sx={{ mt: 0.5 }}>Fetching your performance metrics…</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0f4ff 0%, #fafbff 50%, #f8f0ff 100%)", p: { xs: 2, md: 3 } }}>

      {/* ─── Hero Header ───────────────────────────────── */}
      <Box sx={{
        mb: 3, borderRadius: 4, overflow: "hidden",
        background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 45%, #0284c7 100%)",
        position: "relative",
        boxShadow: "0 20px 60px rgba(2,132,199,0.35)",
      }}>
        {/* Decorative blobs */}
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(56,189,248,0.2)", filter: "blur(50px)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: "20%", width: 200, height: 200, borderRadius: "50%", background: "rgba(14,165,233,0.15)", filter: "blur(40px)", pointerEvents: "none" }} />

        <Box sx={{ p: { xs: 3, md: 4 }, position: "relative", zIndex: 1 }}>
          <Grid container alignItems="stretch" spacing={3}>

            {/* ── COL 1: User Info + Chips ── */}
            <Grid item xs={12} md={5}>
              <Stack justifyContent="space-between" spacing={2}
                sx={{
                  height: "100%",
                  px: 4, py: 2, borderRadius: 3,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                }}>

                {/* Avatar + Name */}
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{
                    width: 78, height: 78,
                    background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                    boxShadow: "0 0 0 4px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.2)",
                  }}>
                    <PersonIcon sx={{ fontSize: "2.2rem", color: "#fff" }} />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 2.5, color: "rgba(186,230,253,0.7)", display: "block", mb: 0.3 }}>
                      PERFORMANCE DASHBOARD
                    </Typography>
                    <Typography variant="h5" fontWeight="900" sx={{ color: "#fff", lineHeight: 1.2 }}>
                      {user?.FullName || user?.UserName || "Welcome back"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(186,230,253,0.75)", mt: 0.3, fontWeight: 500 }}>
                      {userInfo?.title || user?.position || "Employee"} · Q1 2026 (Jul – Sep)
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", pb: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "rgba(186,230,253,0.65)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    Employee Performance Management System
                  </Typography>
                </Box>

                {/* Status chips */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip icon={<CheckCircleIcon sx={{ fontSize: "13px !important", color: "#10b981 !important" }} />}
                    label={`${excellentCount} Excellent`}
                    sx={{ bgcolor: "rgba(16,185,129,0.15)", color: "#6ee7b7", fontWeight: 700, fontSize: "0.72rem", border: "1px solid rgba(16,185,129,0.3)" }}
                  />
                  <Chip icon={<TrendingUpIcon sx={{ fontSize: "13px !important", color: "#f59e0b !important" }} />}
                    label={`${onTrackCount} On Track`}
                    sx={{ bgcolor: "rgba(245,158,11,0.15)", color: "#fcd34d", fontWeight: 700, fontSize: "0.72rem", border: "1px solid rgba(245,158,11,0.3)" }}
                  />
                  <Chip label={`${needsAttentionCount} Needs Attention`}
                    sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#fca5a5", fontWeight: 700, fontSize: "0.72rem", border: "1px solid rgba(239,68,68,0.3)" }}
                  />
                </Stack>

              </Stack>
            </Grid>

            {/* ── COL 2: Overall Achievement (CENTER) ── */}
            <Grid item xs={12} md={3}>
              <Stack alignItems="center" justifyContent="center" spacing={1.5}
                sx={{
                  height: "100%",
                  px: 10, py: 2, borderRadius: 3,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                }}>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: 2.5, color: "rgba(186,230,253,0.65)" }}>
                  OVERALL ACHIEVEMENT
                </Typography>

                {/* ScoreGauge internally renders the 410.9% text */}
                <ScoreGauge value={overallAverage} />

                <Box sx={{ textAlign: "center" }}>
                  <Chip
                    label={getStatusLabel(overallAverage)}
                    size="small"
                    sx={{
                      fontWeight: 800, fontSize: "0.75rem",
                      background: getStatusGradient(overallAverage),
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    }}
                  />
                </Box>
              </Stack>
            </Grid>

            {/* ── COL 3: Motto + Motivation ── */}
            <Grid item xs={12} md={4}>
              <Stack sx={{ height: "100%" }} spacing={0}>

                {/* Bank Motto */}
                <Box sx={{
                  px: 8, py: 2.5,
                  borderRadius: "12px 12px 0 0",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderBottom: "none",
                  backdropFilter: "blur(12px)",
                  flexGrow: 1,
                  display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                  {/* <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: 3, color: "rgba(186,230,253,0.6)", mb: 1.2 }}>
                    🏦 OUR MOTTO
                  </Typography> */}
                  <Typography variant="h5" fontWeight="800" sx={{
                    color: "#fff", fontStyle: "italic",
                    lineHeight: 1.4, textShadow: "0 2px 20px rgba(0,0,0,0.3)", mb: 1.2,
                  }}>
                    "Empowering Communities,<br />Transforming Lives!"
                  </Typography>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mb: 1 }} />
                  <Typography variant="caption" sx={{ color: "rgba(186,230,253,0.5)", fontWeight: 600, letterSpacing: 1.5 }}>
                    Cooperative Bank of Oromia
                  </Typography>
                </Box>

                {/* Motivational Message */}
                <Box sx={{
                  px: 3, py: 2,
                  borderRadius: "0 0 12px 12px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography sx={{ fontSize: "1.8rem", flexShrink: 0 }}>
                      {overallAverage >= 100 ? "🏆" : overallAverage >= 80 ? "🚀" : "🎯"}
                    </Typography>
                    <Box>
                      <Typography variant="body2" fontWeight="800" sx={{ color: "#fff", mb: 0.2, fontSize: "0.82rem" }}>
                        {overallAverage >= 100 ? "Outstanding Performance!" : overallAverage >= 80 ? "Great Progress!" : "Keep Pushing Forward!"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(186,230,253,0.85)", lineHeight: 1.5, fontWeight: 500 }}>
                        {overallAverage >= 100
                          ? "You're exceeding targets. Your dedication inspires your team!"
                          : overallAverage >= 80
                            ? "A final push will get you past 100%!"
                            : "Stay focused on your metrics and keep going!"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

              </Stack>
            </Grid>

          </Grid>
        </Box>
      </Box>


      {/* ─── KPI Summary Strip ─────────────────────────── */}
      <Box sx={{ display: "flex", gap: 2.5, mb: 4, flexWrap: "nowrap" }}>
        {[
          {
            icon: <BarChartIcon />,
            label: "Total Metrics",
            value: metricsData.length,
            sub: `${metricsData.filter(m => m.inputBy === "System").length} system · ${metricsData.filter(m => m.inputBy === "User").length} self-report`,
            gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: "#bfdbfe",
            iconBg: "#3b82f6",
            textColor: "#1e40af",
          },
          {
            icon: <EmojiEventsIcon />,
            label: "At 100%+",
            value: excellentCount,
            sub: "metrics fully achieved",
            gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            border: "#86efac",
            iconBg: "#10b981",
            textColor: "#14532d",
          },
          {
            icon: <WorkspacePremiumIcon />,
            label: "Overall Achievment",
            value: `${overallAverage.toFixed(1)}%`,
            sub: getStatusLabel(overallAverage),
            gradient: overallAverage >= 100
              ? "linear-gradient(135deg, #f0fdf4, #d1fae5)"
              : overallAverage >= 80
                ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
                : "linear-gradient(135deg, #fff1f2, #ffe4e6)",
            border: overallAverage >= 100 ? "#6ee7b7" : overallAverage >= 80 ? "#fcd34d" : "#fca5a5",
            iconBg: getStatusColor(overallAverage),
            textColor: overallAverage >= 100 ? "#064e3b" : overallAverage >= 80 ? "#78350f" : "#7f1d1d",
          },
          {
            icon: <StarIcon />,
            label: "Self-Report",
            value: metricsData.filter(m => m.inputBy === "User").length,
            sub: "metrics need your input",
            gradient: "linear-gradient(135deg, #fdf4ff, #fae8ff)",
            border: "#d8b4fe",
            iconBg: "#8b5cf6",
            textColor: "#581c87",
          },
        ].map((kpi, i) => (
          <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
            <Card elevation={0} sx={{
              borderRadius: 3,
              border: `1px solid ${kpi.border}`,
              background: kpi.gradient,
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": { transform: "translateY(-4px)", boxShadow: `0 12px 32px rgba(0,0,0,0.1)` },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: kpi.iconBg, color: "#fff", width: 48, height: 48, boxShadow: `0 6px 16px ${kpi.iconBg}55`, flexShrink: 0 }}>
                    {kpi.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: kpi.textColor, fontWeight: 700, lineHeight: 1, fontSize: "0.65rem", opacity: 0.8 }}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h4" fontWeight="900" sx={{ color: kpi.textColor, lineHeight: 1.1, mt: 0.3 }}>
                      {kpi.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: kpi.textColor, opacity: 0.7, fontWeight: 600 }}>
                      {kpi.sub}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* ─── Charts ────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Box sx={{ display: "flex", gap: 3, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
          {/* Bar chart – 70% */}
          <Box sx={{ flex: "0 0 70%", maxWidth: { xs: "100%", md: "70%" } }}>
            <Card elevation={0} sx={{
              borderRadius: 3, border: "1px solid #e2e8f0", height: "100%",
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                  <Box sx={{ p: 0.8, borderRadius: 1.5, background: "linear-gradient(135deg, #0284c7, #0ea5e9)" }}>
                    <BarChartIcon sx={{ color: "#fff", fontSize: "1.2rem" }} />
                  </Box>
                  <Typography variant="h6" fontWeight="800" color="#1e293b">
                    Actual vs Expected
                  </Typography>
                </Stack>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 600 }}
                      labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 16, fontSize: 13, fontWeight: 600 }} />
                    <Bar dataKey="Expected" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                    <Bar dataKey="Actual" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={28} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Pie chart – 30% */}
          <Box sx={{ flex: "0 0 30%", maxWidth: { xs: "100%", md: "30%" } }}>
            <Card elevation={0} sx={{
              borderRadius: 3, border: "1px solid #e2e8f0", height: "100%",
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                  <Box sx={{ p: 0.8, borderRadius: 1.5, background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    <AssessmentIcon sx={{ color: "#fff", fontSize: "1.2rem" }} />
                  </Box>
                  <Typography variant="h6" fontWeight="800" color="#1e293b">
                    Achievement Share
                  </Typography>
                </Stack>
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="46%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value" nameKey="name">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 600 }}
                      formatter={(value, name, props) => [`${value}%`, props.payload.fullName || name]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* ─── Metrics Breakdown ─────────────────────────── */}
      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ p: 0.8, borderRadius: 1.5, background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <StarIcon sx={{ color: "#fff", fontSize: "1.2rem" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="800" color="#1e293b">Metrics Breakdown</Typography>
                <Typography variant="caption" color="#64748b" fontWeight={600}>{metricsData.length} metrics assigned to your role</Typography>
              </Box>
            </Stack>
            <Chip
              label="Self-report metrics are editable"
              icon={<EditIcon sx={{ fontSize: "13px !important" }} />}
              size="small"
              sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, border: "1px solid #fcd34d" }}
            />
          </Stack>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
            {metricsData.map((metric, idx) => {
              const statusColor = getStatusColor(metric.rate);
              const isUser = metric.inputBy === "User";
              return (
                <Box key={idx} sx={{ width: "calc(50% - 10px)", minWidth: 0, flexShrink: 0 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: isUser ? "#fde68a" : "#e8edf5",
                      background: isUser
                        ? "linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)"
                        : "linear-gradient(135deg, #f8faff 0%, #ffffff 100%)",
                      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 12px 36px ${statusColor}25`,
                        borderColor: statusColor,
                      },
                      "&::before": metric.actual !== null ? {
                        content: '""',
                        position: "absolute",
                        top: 0, left: 0, right: 0,
                        height: 3,
                        background: getStatusGradient(metric.rate),
                        borderRadius: "12px 12px 0 0",
                      } : {},
                    }}
                  >
                    {/* Header row */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: 2.5,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isUser ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
                          fontSize: "1.4rem", lineHeight: 1,
                          boxShadow: `0 4px 12px ${isUser ? "#f59e0b" : "#6366f1"}22`,
                        }}>
                          {metric.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <Typography variant="subtitle2" fontWeight="800" color="#1e293b" sx={{ lineHeight: 1.3, mb: 0.3 }} noWrap>
                            {metric.name}
                          </Typography>
                          <Chip
                            label={isUser ? "Self Report" : "System"}
                            size="small"
                            icon={isUser
                              ? <EditIcon sx={{ fontSize: "10px !important" }} />
                              : <CheckCircleIcon sx={{ fontSize: "10px !important" }} />
                            }
                            sx={{
                              height: 18, fontSize: "0.62rem", fontWeight: 700,
                              bgcolor: isUser ? "#fef3c7" : "#eff6ff",
                              color: isUser ? "#92400e" : "#1d4ed8",
                            }}
                          />
                        </Box>
                      </Stack>

                      <Box sx={{
                        px: 1.5, py: 0.5, borderRadius: 2,
                        background: metric.actual !== null ? getStatusGradient(metric.rate) : "linear-gradient(135deg, #94a3b8, #64748b)",
                        boxShadow: metric.actual !== null ? `0 4px 12px ${statusColor}55` : "none",
                        minWidth: 56, textAlign: "center",
                      }}>
                        <Typography sx={{ fontWeight: 900, color: "#fff", fontSize: "0.82rem", lineHeight: 1 }}>
                          {metric.actual !== null ? `${metric.rate.toFixed(1)}%` : "—"}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Progress section */}
                    <Box sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                        <Typography variant="caption" fontWeight="700" color="#64748b">Progress</Typography>

                        {isUser ? (
                          <Stack direction="row" alignItems="center" spacing={0.8}>
                            <Tooltip title="Enter your actual value to simulate performance" placement="top">
                              <input
                                type="number"
                                min="0"
                                value={metric.actual !== null ? metric.actual : ""}
                                onChange={(e) => handleManualInput(idx, e.target.value)}
                                placeholder="Enter actual"
                                style={{
                                  width: 88, padding: "4px 8px",
                                  border: "1.5px solid #fbbf24",
                                  borderRadius: 8, fontSize: "0.78rem", fontWeight: 700,
                                  outline: "none", background: "#fffdf0", color: "#78350f",
                                  transition: "border-color 0.2s",
                                }}
                              />
                            </Tooltip>
                            <Typography variant="caption" color="#78350f" fontWeight="700">
                              / {Number(metric.expected) > 0 ? Number(metric.expected).toLocaleString(undefined, { maximumFractionDigits: 1 }) : "N/A"}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="#475569" fontWeight="700">
                            {Number(metric.actual || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            <Typography component="span" variant="caption" color="#94a3b8" fontWeight={600}> / </Typography>
                            {Number(metric.expected) > 0 ? Number(metric.expected).toLocaleString(undefined, { maximumFractionDigits: 1 }) : "N/A"}
                          </Typography>
                        )}
                      </Stack>

                      <Box sx={{ position: "relative", height: 8, borderRadius: 4, bgcolor: "#f1f5f9", overflow: "hidden" }}>
                        <Box sx={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: `${metric.actual !== null ? Math.min(metric.rate, 100) : 0}%`,
                          background: metric.actual !== null ? getStatusGradient(metric.rate) : "#cbd5e1",
                          borderRadius: 4,
                          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                      </Box>
                    </Box>

                    {/* Footer */}
                    {metric.weight > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <Chip
                          label={`Weight: ${metric.weight}%`}
                          size="small"
                          sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, bgcolor: "#f1f5f9", color: "#64748b" }}
                        />
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {metricsData.length === 0 && (
        <Box sx={{
          textAlign: "center", py: 10,
          borderRadius: 3, border: "2px dashed #e2e8f0",
          background: "linear-gradient(135deg, #f8fafc, #fff)",
        }}>
          <Typography variant="h3" sx={{ mb: 2 }}>📊</Typography>
          <Typography variant="h6" color="#475569" fontWeight={700}>No metrics found for your profile</Typography>
          <Typography variant="body2" color="#94a3b8" sx={{ mt: 1 }}>Please contact your administrator to assign metrics to your title.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MyDashboard;
