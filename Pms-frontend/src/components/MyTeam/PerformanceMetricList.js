import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
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
  Grid,
  TextField,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", md: 800 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: "auto",
};

const PerformanceMetricList = ({ member }) => {
  const { user } = useContext(AuthContext);

  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [errors, setErrors] = useState({});
  const [userinfo, setUserinfo] = useState({});
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const [evaluationForm, setEvaluationForm] = useState({
    evaluation_id: null,
    metric_id: "",
    evaluator: "",
    evaluation_value: "",
    weight: "",
    evaluation_date: new Date().toISOString().split("T")[0],
  });



  const fetchMetricsByTitle = async (title, branch_grade) => {
    try {

      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/performances/bytitleName/${encodeURIComponent(title)}/${encodeURIComponent(branch_grade)}`
      );
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch metrics for this title");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/users/byEmail/${encodeURIComponent(member.outlook_address)}`
      );
      setUserinfo(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user profile details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDataforsystemcalculate = async (type) => {
    const requestData = {
      user_id: userinfo.user_name,
      position: userinfo.position,
      process: userinfo.process || null,
      subprocess: userinfo.subprocess || null,
      team: userinfo.team || null,
      cbsusername: userinfo.cbsusername || null,
      company_code: userinfo.company_code,
      organization: userinfo.organization,
    };

    try {
      const targetRes = await axios.post(
        `${baseUrl}/targets/TargetsSummary/`,
        requestData
      );
      // console.log("targetRes", targetRes.data);
      const LoantargetRes = await axios.post(
        `${baseUrl}/targets/loanCollectionTargetByUser/`,
        requestData
      );

      // cash collection and crm cash collection target
      const cashTargetRes = await axios.post(
        `${baseUrl}/targets/cashCollectionTargetByUser/`,
        requestData
      );


      // const BranchManageraccountRes = await axios.post(
      //   `${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`,
      //   requestData
      // );

      // console.log("BranchManageraccountRes", BranchManageraccountRes.data);

      // console.log("loantarget", LoantargetRes.data);
      const totalDeposit = Number(targetRes.data.total_deposit) || 0;
      const totalFcyTarget = Number(targetRes.data.total_fcy) || 0;

      let totalLoanTarget = 0;
      if (userinfo.process === "Interest Free Banking" || userinfo.process === "Agri and Cooperative Business" || (userinfo.process === "Growth and Operations" && userinfo.organization === "Ho")) {
        //for crm and Ho
        totalLoanTarget = Number(targetRes.data.total_loan) || 0;
      } else {
        //for branch users 
        totalLoanTarget = Number(LoantargetRes.data.loan_collection) || 0;
      }

      const cash_collectionTarget = Number(cashTargetRes.data.cash_collection) || 0;
      const cash_deposited_crmTarget = Number(cashTargetRes.data.cash_deposited_crm) || 0;

      if (totalDeposit > 0) {
        if (type === "deposit") {
          const accountRes = await axios.post(
            `${baseUrl}/accountmapping/getBalanceDifference/`,
            requestData
          );
          let ifbBalance = 0;
          const isDirectorOrSenior = requestData.position === "Director" || requestData.position === "Senior Director";
          const isVPOrCHF = requestData.position === "VP" || requestData.position === "CHF";
          const isCEO = requestData.position === "CEO";

          if (
            (isDirectorOrSenior && requestData.subprocess?.trim() === "Sharia Risk, Investment and Financing") ||
            (isVPOrCHF && requestData.process?.trim() === "Interest Free Banking") ||
            isCEO
          ) {
            try {
              const ifbRes = await axios.post(`${baseUrl}/ifb/ifbBalanceDifference`, requestData);
              ifbBalance = ifbRes.data?.total_difference || 0;
            } catch (err) {
              console.error("IFB Error:", err);
            }
          }

          let accountBalance = 0;

          if (requestData.position === 'Manager' && requestData.organization === 'Branch') {
            const BranchManageraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`,
              requestData
            );
            // console.log("BranchManageraccountRes", BranchManageraccountRes.data.local_deposit);
            accountBalance =
              Number(BranchManageraccountRes.data.local_deposit) || 0;
          } else if ((requestData.position === 'Director' || requestData.position === 'Senior Director') && requestData.organization === 'Do') {
            const DistrictDirectoraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`,
              requestData
            );
            // console.log("DistrictDirectoraccountRes", DistrictDirectoraccountRes.data.local_deposit);
            accountBalance =
              Number(DistrictDirectoraccountRes.data.local_deposit) || 0;
          } else {
            // console.log("accountRes", accountRes.data.total_difference);
            accountBalance = Number(accountRes.data.total_difference) || 0;
          }
          // console.log("accountbalance", accountBalance);

          return { actual: accountBalance + ifbBalance, target: totalDeposit };
        }
      }

      if (totalFcyTarget > 0) {
        if (type === "fcy") {
          // const fcyRes = await axios.post(`${baseUrl}/fcy/fcyBalanceDifference`, requestData);
          // return { actual: Number(fcyRes.data.total_difference) || 0, target: totalFcyTarget };
          let fcyBalance = 0;
          if (requestData.position === 'Manager' && requestData.organization === 'Branch') {
            const BranchManageraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`,
              requestData
            );

            fcyBalance =
              Number(BranchManageraccountRes.data.fcy) || 0;
          } else if ((requestData.position === 'Director' || requestData.position === 'Senior Director') && requestData.organization === 'Do') {
            const DistrictDirectoraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`,
              requestData
            );

            fcyBalance =
              Number(DistrictDirectoraccountRes.data.fcy) || 0;
          } else {
            const fcyResMapped = await axios.post(`${baseUrl}/fcy/fcyBalanceDifferenceByUserMapped`, requestData);
            fcyBalance = Number(fcyResMapped.data.total_difference) || 0;
          }
          return { actual: fcyBalance, target: totalFcyTarget };

        }
      }

      if (totalLoanTarget > 0) {
        if (type === "loan") {

          let loanRes = 0;

          if (userinfo.process === "Interest Free Banking" || userinfo.process === "Agri and Cooperative Business" || (userinfo.process === "Growth and Operations" && userinfo.organization === "Ho")) {
            loanRes = await axios.post(
              `${baseUrl}/loan/loanBalanceDifferenceMapped`,
              requestData
            );
            return { actual: Number(loanRes.data.total_difference) || 0, target: totalLoanTarget };
          }
          else {
            loanRes = await axios.post(
              `${baseUrl}/loan/loanBalanceDifference`,
              requestData
            );
            return { actual: Number(loanRes.data.total_difference) || 0, target: totalLoanTarget };
          }
        }
      }
      if (cash_collectionTarget > 0) {
        if (type === "Cash Collection") {
          const collectionRes = await axios.post(`${baseUrl}/nondeposit/getCashDepositbyBranchSummaryByUser`, requestData);
          return { actual: Number(collectionRes.data.total_cash_collection) || 0, target: cash_collectionTarget };
        }
      }

      if (cash_deposited_crmTarget > 0) {
        if (type === "CRM Deposit") {
          const CRMDepositRes = await axios.post(`${baseUrl}/nondeposit/getCRMCashDepositSummaryByUser/`, requestData);
          return { actual: Number(CRMDepositRes.data.total_crm_cash) || 0, target: cash_deposited_crmTarget };
        }
      }





      //nondeposit target
      const userNonDepositTargetRes = await axios.post(`${baseUrl}/non-deposit-target/summary/`, requestData);

      // actual from system
      const newAccountTarget = userNonDepositTargetRes.data.total_new_account || 0;
      const unauthorizeTransTarget = userNonDepositTargetRes.data.total_unauthorized || 0;
      const active_cardTarget = userNonDepositTargetRes.data.active_card || 0;

      const transaction_audit_rateTarget = userNonDepositTargetRes.data.transaction_audit_rate || 0;

      // actuall from evaluater or users
      const coopay_ebirr_activationTarget = userNonDepositTargetRes.data.coopay_ebirr_activation || 0;
      const merchant_recruitmentTarget = userNonDepositTargetRes.data.merchant_recruitment || 0;
      const merchant_transaction_volumeTarget = userNonDepositTargetRes.data.merchant_transaction_volume || 0;
      const agent_recruitmentTarget = userNonDepositTargetRes.data.agent_recruitment || 0;
      const agent_transaction_volumeTarget = userNonDepositTargetRes.data.agent_transaction_volume || 0;
      const michu_unique_recruitmentTarget = userNonDepositTargetRes.data.michu_unique_recruitment || 0;


      const cash_balance_accuracy_rateTarget = userNonDepositTargetRes.data.cash_balance_accuracy_rate || 0;
      const zero_customer_complaintsTarget = userNonDepositTargetRes.data.zero_customer_complaints || 0;


      const avg_txn_per_csoTarget = userNonDepositTargetRes.data.avg_txn_per_cso || 0;
      const compliance_rateTarget = userNonDepositTargetRes.data.compliance_rate || 0;
      const reports_3days_rateTarget = userNonDepositTargetRes.data.reports_3days_rate || 0;
      const audit_report_qualityTarget = userNonDepositTargetRes.data.audit_report_quality || 0;
      const cash_surprise_checksTarget = userNonDepositTargetRes.data.cash_surprise_checks || 0;
      const gl = userNonDepositTargetRes.data.gl || 0;
      // const employee_perf_thresholdTarget = userNonDepositTargetRes.data.employee_perf_threshold || 0;
      const customer_engagementTarget = userNonDepositTargetRes.data.customer_engagement || 0;
      const new_customer_onboardingTarget = userNonDepositTargetRes.data.new_customer_onboarding || 0;
      const armingc_deposit_proportionTarget = userNonDepositTargetRes.data.armingc_deposit_proportion || 0;

      // get atm, eeu, digital target
      const atmEeuDigitalTargetRes = await axios.post(
        `${baseUrl}/non-deposit-target/atm-eeu-digital/`,
        requestData
      );

      const eeu_transactionTarget = atmEeuDigitalTargetRes.data.eeu_transaction || 0;
      const digital_transaction_volumeTarget = atmEeuDigitalTargetRes.data.digital_transaction_volume || 0;
      const atm_crm_uptime_rateTarget = atmEeuDigitalTargetRes.data.atm_crm_uptime_rate || 0;
      const employee_perf_thresholdTarget = atmEeuDigitalTargetRes.data.employee_perf_threshold || 0;



      if (newAccountTarget > 0) {
        if (type === "account") {
          const newaccountRes = await axios.post(`${baseUrl}/nondeposit/new-accounts-summary/`, requestData);
          return { actual: newaccountRes?.data?.total_accounts || 0, target: newAccountTarget };
        }
      }
      if (unauthorizeTransTarget > 0) {
        if (type === "Transaction") {
          const unutorizedTranRes = await axios.post(`${baseUrl}/nondeposit/non-txn-summary/`, requestData);
          return { actual: unutorizedTranRes?.data?.total_unauthorized || 0, target: unauthorizeTransTarget };
        }
      }

      if (active_cardTarget > 0) {
        if (type === "card") {
          const activecardRes = await axios.post(`${baseUrl}/nondeposit/activecard/`, requestData);
          return { actual: activecardRes?.data?.total_active_card_users || 0, target: active_cardTarget };
        }
      }
      if (eeu_transactionTarget > 0) {
        if (type === "EEU") {
          const eeuRes = await axios.post(`${baseUrl}/nondeposit/eeutransaction/`, requestData);
          return { actual: eeuRes?.data?.total_txn_count || 0, target: eeu_transactionTarget };
        }
      }
      if (transaction_audit_rateTarget > 0) {
        if (type === "Transaction Audit") {
          const audittransRes = await axios.post(`${baseUrl}/nondeposit/getAuditedTxnSummaryByUser/`, requestData);
          return { actual: audittransRes?.data?.total_audited_txn_count || 0, target: transaction_audit_rateTarget };
        }
      }
      if (digital_transaction_volumeTarget > 0) {

        if (type === "Digital Transaction") {

          const digtaltsRes = await axios.post(`${baseUrl}/nondeposit/getDigitalTxnPercentageSummaryByUser/`, requestData);
          // console.log("digital_transaction_volume", digtaltsRes);
          return { actual: digtaltsRes?.data?.digital_txn_percentage || 0, target: digital_transaction_volumeTarget };

        }
      }

      if (customer_engagementTarget > 0) {
        if (type === "Customer Engagement") {
          const customerEngagementRes = await axios.post(`${baseUrl}/nondeposit/getCustomerEngagementSummaryByUser/`, requestData);
          return { actual: customerEngagementRes?.data?.total_customer_engagement || 0, target: customer_engagementTarget };
        }
      }

      if (new_customer_onboardingTarget > 0) {
        if (type === "New Customer Onboarding") {
          const newCustomerOnboardingRes = await axios.post(`${baseUrl}/nondeposit/getNewCustomerOnboardingSummaryByUser/`, requestData);
          return { actual: newCustomerOnboardingRes?.data?.total_new_customer_onboarding || 0, target: new_customer_onboardingTarget };
        }
      }

      // if (armingc_deposit_proportionTarget > 0) {
      //   if (type === "Armingc Deposit Proportion") {
      //     const armingcDepositProportionRes = await axios.post(`${baseUrl}/nondeposit/getArmingcDepositProportionSummaryByUser/`, requestData);
      //     return { actual: armingcDepositProportionRes?.data?.total_armingc_deposit_proportion || 0, target: armingc_deposit_proportionTarget };
      //   }
      // }

      if (merchant_transaction_volumeTarget > 0) {
        if (type === "Merchant Transaction Volume") {
          if ((requestData.position === 'Director' || requestData.position === 'Senior Director') && requestData.organization === 'Do') {
            const DistrictDirectoraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`,
              requestData
            );

            return { actual: Number(DistrictDirectoraccountRes.data.merchant_transaction_volume) || 0, target: merchant_transaction_volumeTarget };
          } else {

            const BranchManageraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`,
              requestData
            );
            return { actual: Number(BranchManageraccountRes.data.merchant_transaction_volume) || 0, target: merchant_transaction_volumeTarget };
          }


        }
      }

      if (agent_transaction_volumeTarget > 0) {
        if (type === "Agent Transaction Volume") {
          if ((requestData.position === 'Director' || requestData.position === 'Senior Director') && requestData.organization === 'Do') {
            const DistrictDirectoraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforDistrictDirectors/`,
              requestData
            );
            return { actual: Number(DistrictDirectoraccountRes.data.agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
          } else {

            const BranchManageraccountRes = await axios.post(
              `${baseUrl}/accountmapping/getBalanceDifferenceByUserforManagers/`,
              requestData
            );
            return { actual: Number(BranchManageraccountRes.data.agent_transaction_volume) || 0, target: agent_transaction_volumeTarget };
          }
        }
      }

      if (avg_txn_per_csoTarget > 0) {
        if (type === "Avg Txn Per CSO") {
          const csoTransactionPerformanceRes = await axios.post(`${baseUrl}/nondeposit/getCsoTransactionPerformance/`, requestData);
          return { actual: csoTransactionPerformanceRes?.data?.total_accomplishment_percentage || 0, target: avg_txn_per_csoTarget };
        }
      }
      if (gl > 0) {
        if (type === "GL") {
          const glRes = await axios.post(`${baseUrl}/nondeposit/getBranchInternalAccountsSummary/`, requestData);
          return { actual: glRes?.data?.internal_account_value || 0, target: gl };
        }
      }
      // for SPM
      if (type === "SPM") {

        // ================================
        // Loan Special Mention
        // ================================
        const specialMentionLoanRes = await axios.post(
          `${baseUrl}/loanaccountmapping/getSpecialMentionLoanSumBalanceByUser`,
          requestData
        );

        const specialMentionActual =
          specialMentionLoanRes?.data?.total_balance || 0;

        // ================================
        // Loan Outstanding Balance
        // ================================
        const loanOutstandingBalanceRes = await axios.post(
          `${baseUrl}/loanaccountmapping/getLoanOutstandingBalanceByUser`,
          requestData
        );

        const outstandingBalanceActual =
          loanOutstandingBalanceRes?.data?.total_balance || 0;

        return {
          actual: specialMentionActual,
          target: outstandingBalanceActual,
        };
      }


      // District Map
      if (type === "District Map") {
        try {
          const mappedDistricts = await axios.post(
            `${baseUrl}/districtmapping/getMappedDistrictsByUser/${requestData.user_id}`
          );

          if (mappedDistricts.data && mappedDistricts.data.length > 0) {
            const districtsObject = {
              districts: mappedDistricts.data.map((item) => item.district_name)
            };

            const districtRes = await axios.post(
              `${baseUrl}/districtmapping/getTargetsAndDepositByDistricts`,
              districtsObject
            );

            let totalActual = 0;
            let totalTarget = 0;

            districtRes.data.forEach((item) => {
              totalTarget += Number(item.total_deposit_target) || 0;
              totalActual += Number(item.balance_difference) || 0;
            });

            return { actual: totalActual, target: totalTarget };
          } else {
            return { actual: 0, target: 0 };
          }
        } catch (error) {
          console.error("Error fetching district map data:", error);
          return { actual: 0, target: 0 };
        }
      }

      // Branch Vital
      if (type === "Branch Vital") {

        const branchVitalRes = await axios.post(
          `${baseUrl}/branchvital/branch-vital-summary`,
          requestData,
        );

        return {
          actual: branchVitalRes?.data?.OUT_OF_100 || 0,
          target: 0,
        };
      }

      // null actual from system 

      if (type === "Merchant Recruitment") {

        return { actual: 0, target: merchant_recruitmentTarget };
      }


      if (type === "Agent Recruitment") {

        return { actual: 0, target: agent_recruitmentTarget };
      }


      if (type === "Michu Unique Recruitment") {

        return { actual: 0, target: michu_unique_recruitmentTarget };
      }

      if (type === "Coopay Ebirr Activation") {

        return { actual: 0, target: coopay_ebirr_activationTarget };
      }

      if (type === "ATM CRM Uptime Rate") {
        return { actual: 0, target: atm_crm_uptime_rateTarget };
      }
      if (type === "Cash Book") {
        return { actual: 0, target: cash_balance_accuracy_rateTarget };
      }
      if (type === "Customer Satisfaction") {
        return { actual: 0, target: zero_customer_complaintsTarget };
      }
      // if (type === "Avg Txn Per CSO") {
      //   return { actual: 0, target: avg_txn_per_csoTarget };
      // }
      if (type === "Branch Compliance") {
        return { actual: 0, target: compliance_rateTarget };
      }
      if (type === "Audit Report") {
        return { actual: 0, target: reports_3days_rateTarget };
      }
      if (type === "Audit Quality") {
        return { actual: 0, target: audit_report_qualityTarget };
      }
      if (type === "Cash Surprise Cheque") {
        return { actual: 0, target: cash_surprise_checksTarget };
      }

      if (type === "Employee Performance") {
        return { actual: 0, target: employee_perf_thresholdTarget };
      }
      if (type === "Armingc Deposit Proportion") {
        return { actual: 0, target: armingc_deposit_proportionTarget };
      }

      return { actual: 0, target: 0 };
    } catch (err) {
      console.error(err);
      return { actual: 0, target: 0 };
    }
  };

  const handleAddEvaluation = async (metric) => {
    // console.log("metric", metric);
    setSelectedMetric(metric);
    let type = "";
    const lowerCalcFor = metric.calculated_for?.toLowerCase().trim() || "";

    if (lowerCalcFor === "deposit") type = "deposit";
    else if (lowerCalcFor === "fcy") type = "fcy";
    else if (lowerCalcFor === "loan") type = "loan";
    else if (lowerCalcFor === "card") type = "card";
    else if (lowerCalcFor === "transaction") type = "Transaction";
    else if (lowerCalcFor === "account") type = "account";
    else if (lowerCalcFor === "eeu") type = "EEU";
    else if (lowerCalcFor === "transaction audit") type = "Transaction Audit";
    else if (lowerCalcFor === "digital transaction") type = "Digital Transaction";
    else if (lowerCalcFor === "cash collection") type = "Cash Collection";
    else if (lowerCalcFor === "crm deposit") type = "CRM Deposit";
    else if (lowerCalcFor === "merchant recruitment") type = "Merchant Recruitment";
    else if (lowerCalcFor === "merchant transaction volume") type = "Merchant Transaction Volume";
    else if (lowerCalcFor === "agent recruitment") type = "Agent Recruitment";
    else if (lowerCalcFor === "agent transaction volume") type = "Agent Transaction Volume";
    else if (lowerCalcFor === "michu unique recruitment") type = "Michu Unique Recruitment";
    else if (lowerCalcFor === "coopay ebirr activation") type = "Coopay Ebirr Activation";
    else if (lowerCalcFor === "atm crm uptime rate") type = "ATM CRM Uptime Rate";
    else if (lowerCalcFor === "customer") type = "Customer";
    else if (lowerCalcFor === "product") type = "Product";
    else if (lowerCalcFor === "gl") type = "GL";
    else if (lowerCalcFor === "customer satisfaction") type = "Customer Satisfaction";
    else if (lowerCalcFor === "cash book") type = "Cash Book";
    else if (lowerCalcFor === "cash surprise cheque") type = "Cash Surprise Cheque";
    else if (lowerCalcFor === "audit quality") type = "Audit Quality";
    else if (lowerCalcFor === "branch compliance") type = "Branch Compliance";
    else if (lowerCalcFor === "compliance with the directives") type = "Compliance with the directives";
    else if (lowerCalcFor === "cash balance accuracy rate") type = "Cash Balance Accuracy Rate";
    else if (lowerCalcFor === "zero customer complaints") type = "Zero Customer Complaints";
    else if (lowerCalcFor === "avg txn per cso") type = "Avg Txn Per CSO";
    else if (lowerCalcFor === "compliance rate") type = "Compliance Rate";
    else if (lowerCalcFor === "audit report") type = "Audit Report";
    else if (lowerCalcFor === "employee performance") type = "Employee Performance";
    else if (lowerCalcFor === "customer engagement") type = "Customer Engagement";
    else if (lowerCalcFor === "new customer onboarding") type = "New Customer Onboarding";
    else if (lowerCalcFor === "armingc deposit proportion") type = "Armingc Deposit Proportion";
    else if (lowerCalcFor === "deposit sustainability") type = "Deposit Sustainability";
    else if (lowerCalcFor === "spm") type = "SPM";
    else if (lowerCalcFor === "branch vital") type = "Branch Vital";
    else if (lowerCalcFor === "district map") type = "District Map";
    let evaluationValue = 0;
    let calculatedWeight = 0;
    if (metric.input_by === "System") {
      let actualachive = 0;
      const { actual, target } = await fetchDataforsystemcalculate(type);
      metric.target_fy = target;

      evaluationValue = parseFloat(actual) || 0; // input value
      const targetTo = parseFloat(target) || 1; // avoid division by 0
      const divider = parseFloat(metric?.divider_or_multiplied) || 1;
      const metricWeight = parseFloat(metric?.metric_weight) || 0;

      // Calculate weight consider grter than 100
      if (metric.calculated_with === ">100") {
        const actualachive = (evaluationValue / targetTo) * 100;

        if (actualachive >= 120) {
          calculatedWeight = 5 * metricWeight;
        } else if (actualachive >= 100 && actualachive < 120) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 75 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 50 && actualachive < 75) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive > 0 && actualachive < 50) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      } else if (metric.calculated_with === "100") {
        //  GL
        if (metric.calculated_for === "Gl") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        //  ATM
        else if (metric.calculated_for === "ATM CRM Uptime Rate") {
          actualachive = (evaluationValue / targetTo) * 100;
          if (actualachive >= 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 92 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 92) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 80 && actualachive < 85) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Transaction
        else if (metric.calculated_for === "Transaction") {
          actualachive = (evaluationValue / targetTo) * 100;
          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Customer Satisfaction
        else if (metric.calculated_for === "Customer Satisfaction") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 99 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 98 && actualachive < 99) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 97 && actualachive < 98) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Cash Book
        else if (metric.calculated_for === "Cash Book") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 95 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 90 && actualachive < 95) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 90) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Cash Surprise Cheque
        else if (metric.calculated_for === "Cash Surprise Cheque") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 83 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 67 && actualachive < 83) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 50 && actualachive < 67) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Branch Compliance
        else if (metric.calculated_for === "Branch Compliance") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 95 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 90 && actualachive < 95) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 90) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Audit Report
        else if (metric.calculated_for === "Audit Report") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 67 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Audit Quality
        else if (metric.calculated_for === "Audit Quality") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 95 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 90 && actualachive < 95) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 90) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Transaction Audit
        else if (metric.calculated_for === "Transaction Audit") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // SPM
        else if (metric.calculated_for === "SPM") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive < 3) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 3 && actualachive <= 4) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive > 4 && actualachive <= 5) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive > 5) {
            calculatedWeight = 0;
          } else {
            calculatedWeight = 0;
          }
        }
        // Arming C for District
        else if (metric.calculated_for === "Armingc Deposit Proportion") {
          actualachive = (evaluationValue / targetTo) * 100;
          if (actualachive >= 86 && actualachive <= 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 71 && actualachive < 86) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 57 && actualachive < 71) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 14 && actualachive < 57) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // Employee Performance
        else if (selectedMetric.calculated_for === "Employee Performance") {
          actualachive = (evaluationValue / targetTo) * 100;
          if (actualachive >= 90 && actualachive <= 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 75 && actualachive < 90) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 50 && actualachive < 75) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 25 && actualachive < 50) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // branch Vital
        else if (metric.calculated_for === "Branch Vital") {
          calculatedWeight = (evaluationValue * metricWeight);
        }
      } else {
        calculatedWeight = 0;
      }
    }


    if (metric.input_by === "User") {

      const { actual, target } = await fetchDataforsystemcalculate(type);


      // evaluationValue = parseFloat(actual) || 0; // input value
      let actualachive = 0;
      let targetTo = 0;
      evaluationValue = 0; // input value

      if (target === 0) {
        targetTo = 1;
      } else {
        targetTo = parseFloat(target);
        metric.target_fy = target;
      }
      const divider = parseFloat(metric?.divider_or_multiplied) || 1;

      const metricWeight = parseFloat(metric?.metric_weight) || 0;
      if (metric.calculated_with === "100") {
        //  GL
        if (metric.calculated_for === "Gl") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        //  ATM
        else if (metric.calculated_for === "ATM CRM Uptime Rate") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive >= 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 92 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 92) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 80 && actualachive < 85) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Transaction
        else if (metric.calculated_for === "Transaction") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Customer Satisfaction
        else if (metric.calculated_for === "Customer Satisfaction") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 99 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 98 && actualachive < 99) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 97 && actualachive < 88) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Cash Book
        else if (metric.calculated_for === "Cash Book") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 95 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 90 && actualachive < 95) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 90) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Cash Surprise Cheque
        else if (metric.calculated_for === "Cash Surprise Cheque") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 83 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 67 && actualachive < 83) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 50 && actualachive < 67) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Branch Compliance
        else if (metric.calculated_for === "Branch Compliance") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 95 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 90 && actualachive < 95) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 90) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Audit Report
        else if (metric.calculated_for === "Audit Report") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 67 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Audit Quality
        else if (metric.calculated_for === "Audit Quality") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 95 && actualachive < 100) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 90 && actualachive < 95) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 85 && actualachive < 90) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Transaction Audit
        else if (metric.calculated_for === "Transaction Audit") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive === 100) {
            calculatedWeight = 4 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Arming C for District
        else if (metric.calculated_for === "Armingc Deposit Proportion") {
          actualachive = (evaluationValue / targetTo) * 100;

          if (actualachive >= 86 && actualachive <= 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 71 && actualachive < 86) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 57 && actualachive < 71) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 14 && actualachive < 57) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }

        // Employee Performance
        else if (selectedMetric.calculated_for === "Employee Performance") {
          actualachive = (evaluationValue / targetTo) * 100;
          if (actualachive >= 90 && actualachive <= 100) {
            calculatedWeight = 4 * metricWeight;
          } else if (actualachive >= 75 && actualachive < 90) {
            calculatedWeight = 3 * metricWeight;
          } else if (actualachive >= 50 && actualachive < 75) {
            calculatedWeight = 2 * metricWeight;
          } else if (actualachive >= 25 && actualachive < 50) {
            calculatedWeight = 1 * metricWeight;
          } else {
            calculatedWeight = 0;
          }
        }
        // branch Vital

        else if (metric.calculated_for === "Branch Vital") {

          calculatedWeight = (evaluationValue * metricWeight);
        }
      } else if (metric.calculated_with === ">100") {
        const actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive >= 120) {
          calculatedWeight = 5 * metricWeight;
        } else if (actualachive >= 100 && actualachive < 120) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 75 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 50 && actualachive < 75) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive > 0 && actualachive < 50) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      } else {
        calculatedWeight = 0;
      }
    }

    setEvaluationForm({
      evaluation_id: null,
      input_by: metric.input_by,
      metric_id: metric.metric_id,
      evaluator: user.MailAdress,
      evaluated: member.outlook_address, // new field
      employee_id: member.employee_id, // new field
      process: member.process_name, // new field
      subprocess: member.sub_process_name, // new field
      branch: member.branch_name, // new field
      evaluation_value: evaluationValue?.toFixed(2) || "0",
      weight: calculatedWeight.toFixed(2) / 100,
      evaluation_date: new Date().toISOString().split("T")[0],
      created_by: "", // optional, if you track creator
      updated_by: "", // optional
      outlook_address: member.outlook_address,
    });
    setShowEvalModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!evaluationForm.evaluation_value || isNaN(evaluationForm.evaluation_value)) {
      toast.error("Valid evaluation value is required");
      return;
    }

    try {
      setLoading(true);
      if (evaluationForm.evaluation_id) {
        await axios.put(`${baseUrl}/evaluations/${evaluationForm.evaluation_id}`, evaluationForm);
        toast.success("Evaluation updated successfully");
      } else {
        await axios.post(`${baseUrl}/evaluations/createEvaluation/`, { ...evaluationForm, created_by: user.FullName });
        toast.success("Evaluation saved successfully");
      }
      setShowEvalModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save evaluation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    if (member.title) fetchMetricsByTitle(member.title, member.branch_grade);
  }, [member.title, member.branch_grade]);

  const handleEvaluationChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    let targetTo = parseFloat(selectedMetric?.target_fy);
    if (isNaN(targetTo) || targetTo === 0) {
      targetTo = 1;
    }
    const metricWeight = parseFloat(selectedMetric?.metric_weight) || 0;

    let calculatedWeight = 0;
    let actualachive = 0;
    const evaluationValue = value;

    if (selectedMetric?.calculated_with === "100") {
      //  GL
      if (selectedMetric.calculated_for === "Gl") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      //  ATM
      else if (selectedMetric.calculated_for === "ATM CRM Uptime Rate") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive >= 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 92 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 85 && actualachive < 92) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 80 && actualachive < 85) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Transaction
      else if (selectedMetric.calculated_for === "Transaction") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Customer Satisfaction
      else if (selectedMetric.calculated_for === "Customer Satisfaction") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 99 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 98 && actualachive < 99) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 97 && actualachive < 98) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Cash Book
      else if (selectedMetric.calculated_for === "Cash Book") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 95 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 90 && actualachive < 95) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 85 && actualachive < 90) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Cash Surprise Cheque
      else if (selectedMetric.calculated_for === "Cash Surprise Cheque") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 83 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 67 && actualachive < 83) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 50 && actualachive < 67) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Branch Compliance
      else if (selectedMetric.calculated_for === "Branch Compliance") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 95 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 90 && actualachive < 95) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 85 && actualachive < 90) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Audit Report
      else if (selectedMetric.calculated_for === "Audit Report") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 67 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Audit Quality
      else if (selectedMetric.calculated_for === "Audit Quality") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 95 && actualachive < 100) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 90 && actualachive < 95) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 85 && actualachive < 90) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Transaction Audit
      else if (selectedMetric.calculated_for === "Transaction Audit") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive === 100) {
          calculatedWeight = 4 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // SPM
      else if (selectedMetric.calculated_for === "SPM") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive < 3) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 3 && actualachive <= 4) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive > 4 && actualachive <= 5) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive > 5) {
          calculatedWeight = 0;
        } else {
          calculatedWeight = 0;
        }
      }
      // Arming C for District
      else if (selectedMetric.calculated_for === "Armingc Deposit Proportion") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive >= 86 && actualachive <= 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 71 && actualachive < 86) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 57 && actualachive < 71) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 14 && actualachive < 57) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // Employee Performance
      else if (selectedMetric.calculated_for === "Employee Performance") {
        actualachive = (evaluationValue / targetTo) * 100;
        if (actualachive >= 90 && actualachive <= 100) {
          calculatedWeight = 4 * metricWeight;
        } else if (actualachive >= 75 && actualachive < 90) {
          calculatedWeight = 3 * metricWeight;
        } else if (actualachive >= 50 && actualachive < 75) {
          calculatedWeight = 2 * metricWeight;
        } else if (actualachive >= 25 && actualachive < 50) {
          calculatedWeight = 1 * metricWeight;
        } else {
          calculatedWeight = 0;
        }
      }
      // branch Vital
      else if (selectedMetric.calculated_for === "Branch Vital") {
        calculatedWeight = (evaluationValue * metricWeight);
      } else {
        // Fallback generic calculation for "100" if no specific rule matches
        calculatedWeight = (value / targetTo) * (parseFloat(selectedMetric?.divider_or_multiplied) || 1) * metricWeight;
        if (calculatedWeight > metricWeight) calculatedWeight = metricWeight;
      }
    } else if (selectedMetric?.calculated_with === ">100") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive >= 120) {
        calculatedWeight = 5 * metricWeight;
      } else if (actualachive >= 100 && actualachive < 120) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 75 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 50 && actualachive < 75) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive > 0 && actualachive < 50) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    } else {
      // Generic calculation when no specific criteria matches
      // calculatedWeight = (value / targetTo) * (parseFloat(selectedMetric?.divider_or_multiplied) || 1) * metricWeight;
      // if (calculatedWeight > metricWeight) calculatedWeight = metricWeight;
      console.error("No specific criteria matched for metric: ", selectedMetric.metric_name);
    }

    setEvaluationForm((prev) => ({
      ...prev,
      evaluation_value: value,
      weight: (calculatedWeight / 100).toFixed(4),
    }));
  };

  return (
    <Box>
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Table size="small" hover>
          <TableHead sx={{ backgroundColor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Metric Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
              {/* <TableCell sx={{ fontWeight: 600 }}>Target FY</TableCell> */}
              <TableCell sx={{ fontWeight: 600 }}>Input By</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Calculated For</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.map((m) => (
              <TableRow key={m.metric_id} hover>
                <TableCell>{m.metric_id}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{m.metric_name}</Typography>
                  <Typography variant="caption" color="textSecondary">{m.objective_name}</Typography>
                </TableCell>
                <TableCell>{m.metric_weight}%</TableCell>
                {/* <TableCell>{m.target_fy} {m.unit_of_measure}</TableCell> */}
                <TableCell>{m.input_by}</TableCell>
                <TableCell>{m.calculated_for}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    color="info"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => handleAddEvaluation(m)}
                  >
                    Evaluate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* {console.log('selectedMetric', selectedMetric)}
      {console.log('evaluationForm', evaluationForm)} */}

      {/* Evaluation Modal */}
      <Modal
        open={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={showEvalModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Metric Evaluation
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Metric Name" value={selectedMetric?.metric_name || ""} disabled size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Metric Weight (%)" value={selectedMetric?.metric_weight || ""} disabled size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Target FY" value={selectedMetric?.target_fy || 0} disabled size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Evaluator" value={evaluationForm.evaluator} InputProps={{ readOnly: true }} size="small" variant="filled" />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Evaluation Value"
                    type="number"
                    value={evaluationForm.evaluation_value}
                    onChange={handleEvaluationChange}
                    disabled={selectedMetric?.input_by?.toLowerCase() === "system"}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Calculated Result Weight"
                    value={evaluationForm.weight}
                    disabled
                    size="small"
                    helperText="Auto-calculated based on input and weight"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={() => setShowEvalModal(false)}>Cancel</Button>
                <Button type="submit" variant="contained" color="info">
                  Submit Evaluation
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {loading && (
        <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 2 }} open={loading}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </Box>
  );
};

export default PerformanceMetricList;
