import express from "express";
import {
  getNewAccountsSummaryByUser,
  getNauTxnSummaryByUser,
  getActiveCardUsersSummaryByUser,
  getEeuPaymentsSummaryByUser,
  getAuditedTxnSummaryByUser,
  getDigitalTxnPercentageSummaryByUser,
  getCRMCashDepositSummaryByUser,
  getCustomerEngagementSummaryByUser,
  getNewCustomerOnboardingSummaryByUser,
  getCashDepositbyBranchSummaryByUser,
  getCsoTransactionPerformance,
  getBranchInternalAccountsSummary
} from "../controllers/NonDepositActualController.js";

const router = express.Router();
router.post("/new-accounts-summary", getNewAccountsSummaryByUser);
router.post("/non-txn-summary", getNauTxnSummaryByUser);
router.post("/activecard", getActiveCardUsersSummaryByUser);
router.post("/eeutransaction", getEeuPaymentsSummaryByUser);
router.post("/getAuditedTxnSummaryByUser", getAuditedTxnSummaryByUser);
router.post("/getDigitalTxnPercentageSummaryByUser", getDigitalTxnPercentageSummaryByUser);
router.post("/getCRMCashDepositSummaryByUser", getCRMCashDepositSummaryByUser);
router.post("/getCustomerEngagementSummaryByUser", getCustomerEngagementSummaryByUser);
router.post("/getNewCustomerOnboardingSummaryByUser", getNewCustomerOnboardingSummaryByUser);
router.post("/getCashDepositbyBranchSummaryByUser", getCashDepositbyBranchSummaryByUser);
router.post("/getCsoTransactionPerformance", getCsoTransactionPerformance);
router.post("/getBranchInternalAccountsSummary", getBranchInternalAccountsSummary);

export default router;
