// Shared metric engine — extracted from MyDashboard.js so the team view can
// compute each member's per-metric achievement exactly the way the employee
// sees on their own dashboard.
import { calculateMetricScore } from "./scoreCalculator";

// Quarter window used across the app
export const quarterProgress = () => {
  const startDate = new Date("2026-07-01");
  const today = new Date();
  let daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  daysPassed = Math.max(0, Math.min(daysPassed, 90));
  return { daysPassed, quarterRatio: daysPassed / 90 };
};

export const ICON_MAP = {
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

export const TYPE_MAP = {
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
  "michu loan collection": "Michu Loan Collection",
  "coopay ebirr activation": "Coopay Ebirr Activation",
  "cash book": "Cash Book",
  "customer satisfaction": "Customer Satisfaction",
  "branch compliance": "Branch Compliance",
  "audit report": "Audit Report",
  "audit quality": "Audit Quality",
  "cash surprise cheque": "Cash Surprise Cheque",
  "armingc deposit proportion": "Armingc Deposit Proportion",
};

// Exact MyDashboard implementation (moved verbatim; axios/baseUrl passed in)
export const fetchSystemData = async (axios, baseUrl, type, requestData, targetsCache) => {

  // console.log("requestData", requestData);
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
      if ((requestData.title === 'Branch Manager I' || requestData.title === 'Branch Manager II' || requestData.title === 'Branch Manager III' || requestData.title === 'Branch Manager IV' || (requestData.title?.includes('Manager Operation Management') && (requestData.team?.includes('Eco') || requestData.team?.includes('Micro')))) && requestData.organization === 'Branch') {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData).catch(() => ({ data: {} }));
        accountBalance = Number(r.data?.local_deposit) || 0;
      } else if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData).catch(() => ({ data: {} }));
        accountBalance = Number(r.data?.local_deposit) || 0;
      } else if (requestData.title === 'Area Manager') {
        const AreaManagerRes = await axios.post(`${baseUrl}/area-manager-branch/area-manager-performance`, requestData);
        accountBalance = Number(AreaManagerRes.data.total_local_deposit) || 0;
      } else {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifference/`, requestData).catch(() => ({ data: {} }));
        accountBalance = Number(r.data?.total_difference) || 0;
      }
      return { actual: accountBalance, target: totalDeposit };
    }

    if (type === "fcy" && totalFcyTarget > 0) {
      let fcyBalance = 0;
      if ((requestData.title === 'Branch Manager I' || requestData.title === 'Branch Manager II' || requestData.title === 'Branch Manager III' || requestData.title === 'Branch Manager IV' || (requestData.title?.includes('Manager Operation Management') && (requestData.team?.includes('Eco') || requestData.team?.includes('Micro')))) && requestData.organization === 'Branch') {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData).catch(() => ({ data: {} }));
        fcyBalance = Number(r.data?.fcy) || 0;
      } else if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData).catch(() => ({ data: {} }));
        fcyBalance = Number(r.data?.fcy) || 0;
      } else if (requestData.title === 'Area Manager') {
        const AreaManagerRes = await axios.post(`${baseUrl}/area-manager-branch/area-manager-performance`, requestData);
        fcyBalance = Number(AreaManagerRes.data.total_fcy) || 0;
      } else if (requestData.title === 'Customer Service Officer' || (requestData.title?.includes('Manager Operation Management') && !(requestData.team?.includes('Eco') || requestData.team?.includes('Micro')))) {
        const remittanceRes = await axios.get(`${baseUrl}/accountmapping/remittance-actual/${requestData.company_code}`).catch(() => ({ data: {} }));
        fcyBalance = Number(remittanceRes.data?.REMITTANCE_AND_CASH_PURCHASE_ACTUAL) || 0;
      } else {
        const r = await axios.post(`${baseUrl}/fcy/fcyBalanceDifferenceByUserMapped`, requestData).catch(() => ({ data: {} }));
        fcyBalance = Number(r.data?.total_difference) || 0;
      }
      return { actual: fcyBalance, target: totalFcyTarget };
    }

    if (type === "loan" && totalLoanTarget > 0) {
      console.log("totalLoanTarget", totalLoanTarget);
      let loanActual = 0;
      if (requestData.process === "Interest Free Banking" || requestData.process === "Agri and Cooperative Business" || (requestData.process === "Growth and Operations" && requestData.organization === "Ho")) {
        const r = await axios.post(`${baseUrl}/loan/loanBalanceDifferenceMapped`, requestData).catch(() => ({ data: {} }));
        loanActual = Number(r.data?.total_difference) || 0;
      } else if (requestData.title === 'Area Manager') {
        const AreaManagerRes = await axios.post(`${baseUrl}/area-manager-branch/area-manager-performance`, requestData);
        loanActual = Number(AreaManagerRes.data.total_loan_collection) || 0;
      } else {
        const r = await axios.post(`${baseUrl}/loan/loanBalanceDifference`, requestData).catch(() => ({ data: {} }));
        loanActual = Number(r.data?.total_difference) || 0;
      }
      return { actual: loanActual, target: totalLoanTarget };
    }

    if (type === "Cash Collection" && cash_collectionTarget > 0) {
      const r = await axios.post(`${baseUrl}/nondeposit/getCashDepositbyBranchSummaryByUser`, requestData);
      return { actual: Number(r.data?.total_cash_collection) || 0, target: cash_collectionTarget };
    }

    if (type === "Michu Loan Collection" && michu_loan_collectionTarget > 0) {
      const r = await axios.post(`${baseUrl}/accountmapping/getMichuCollectionByUser`, requestData);
      return { actual: Number(r.data?.total_michu_collection) || 0, target: michu_loan_collectionTarget };
    }

    if (type === "account" && newAccountTarget > 0) {
      if (requestData.title === 'Area Manager') {
        const AreaManagerRes = await axios.post(`${baseUrl}/area-manager-branch/area-manager-performance`, requestData);
        return { actual: Number(AreaManagerRes.data.total_new_accounts) || 0, target: newAccountTarget };
      } else {
        const r = await axios.post(`${baseUrl}/nondeposit/new-accounts-summary/`, requestData).catch(() => ({ data: {} }));
        return { actual: r.data?.total_accounts || 0, target: newAccountTarget };
      }
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
      } else if (requestData.title === 'Area Manager') {
        const AreaManagerRes = await axios.post(`${baseUrl}/area-manager-branch/area-manager-performance`, requestData);
        return { actual: Number(AreaManagerRes.data.total_merchant_transaction_volume) || 0, target: merchant_transaction_volumeTarget };
      } else {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData);
        return { actual: Number(r.data?.merchant_transaction_volume) || 0, target: merchant_transaction_volumeTarget };
      }
    }

    if (type === "Agent Transaction Volume" && agent_transaction_volumeTarget > 0) {
      if ((requestData.position === "Director" || requestData.position === "Senior Director") && requestData.organization === "Do") {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`, requestData);
        return { actual: Number(r.data?.agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
      } else if (requestData.title === 'Area Manager') {
        const AreaManagerRes = await axios.post(`${baseUrl}/area-manager-branch/area-manager-performance`, requestData);
        return { actual: Number(AreaManagerRes.data.total_agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
      } else {
        const r = await axios.post(`${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`, requestData);
        return { actual: Number(r.data?.agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
      }
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


    if (type === "Michu Unique Recruitment") {
      const r = await axios.post(`${baseUrl}/nondeposit/getMichuRecruitmentByUser`, requestData);
      return { actual: Number(r.data?.total_michu_recruitment) || 0, target: michu_unique_recruitmentTarget };
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

/**
 * buildMemberMetrics
 * Runs the full MyDashboard pipeline for one team member and returns the same
 * metric objects the member sees on their own dashboard (name, expected pace,
 * actual, rate, weight, score) plus the overall score.
 * `member` is a row from /users/getUserByPostion (has user_name, title,
 * position, ..., mail_address).
 */
export const buildMemberMetrics = async (axios, baseUrl, member) => {
  const requestData = {
    user_id: member.user_name,
    username: member.user_name,
    user_name: member.user_name,
    position: member.position || "",
    title: member.title || "",
    process: member.process || null,
    subprocess: member.subprocess || null,
    team: member.team || null,
    cbsusername: member.cbsusername || null,
    company_code: member.company_code || null,
    organization: member.organization || null,
  };

  // Title / branch grade resolution — same source the employee flow uses.
  // Falls back to the users-table title when no email is on file.
  let title = requestData.title || requestData.position || "";
  let branch_grade = "";
  if (member.mail_address) {
    const empRes = await axios.get(`${baseUrl}/employees/title/email`, {
      params: { email: member.mail_address },
    }).catch(() => ({ data: {} }));
    title = empRes.data?.title_name || title;
    branch_grade = empRes.data?.branch_grade || "";
  }

  const metricRes = await axios.get(
    `${baseUrl}/performances/bytitleName/${encodeURIComponent(title)}/${encodeURIComponent(branch_grade)}`
  );
  const assignedMetrics = Array.isArray(metricRes.data) ? metricRes.data : [];
  if (assignedMetrics.length === 0) return { metrics: [], overallScore: 0, title };

  const [targetRes, LoantargetRes, cashTargetRes, userNonDepositTargetRes, atmEeuDigitalTargetRes] = await Promise.all([
    axios.post(`${baseUrl}/targets/TargetsSummary/`, requestData),
    axios.post(`${baseUrl}/targets/loanCollectionTargetByUser/`, requestData),
    axios.post(`${baseUrl}/targets/cashCollectionTargetByUser/`, requestData),
    axios.post(`${baseUrl}/non-deposit-target/summary/`, requestData),
    axios.post(`${baseUrl}/non-deposit-target/atm-eeu-digital/`, requestData),
  ]);
  const targetsCache = { targetRes, LoantargetRes, cashTargetRes, userNonDepositTargetRes, atmEeuDigitalTargetRes };

  const { quarterRatio } = quarterProgress();

  const metricsPromises = assignedMetrics.map(async (metric) => {
    const calcFor = metric.calculated_for?.toLowerCase().trim() || "";
    const type = TYPE_MAP[calcFor] || calcFor;
    const icon = ICON_MAP[calcFor] || ICON_MAP.default;
    const isUserInput = metric.input_by === "User";

    const result = await fetchSystemData(axios, baseUrl, type, requestData, targetsCache);
    const expected = (result.target || 0) * quarterRatio;
    const actual = isUserInput ? null : (result.actual || 0);

    const rate = expected > 0 && actual !== null ? (actual / expected) * 100 : 0;
    const targetTo = expected === 0 ? 1 : expected;
    let score = 0;
    if (actual !== null) {
      const scoreObj = calculateMetricScore(metric, actual, targetTo);
      score = scoreObj.score || 0;
    }

    return {
      name: metric.metric_name || metric.calculated_for || "Metric",
      calcFor,
      expected,
      actual,
      rate,
      icon,
      inputBy: isUserInput ? "User" : "System",
      weight: metric.metric_weight || 0,
      score,
      metric,
    };
  });

  const resolved = await Promise.all(metricsPromises);
  const overallScore = resolved
    .filter((m) => m.actual !== null)
    .reduce((sum, m) => sum + (Number(m.score) || 0), 0);

  return { metrics: resolved, overallScore, title };
};
