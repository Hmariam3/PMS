import express from "express";
import {
  getNewAccountsSummaryByUser,
  getNauTxnSummaryByUser,
  getActiveCardUsersSummaryByUser,
  getEeuPaymentsSummaryByUser,
  getAuditedTxnSummaryByUser,
  getDigitalTxnPercentageSummaryByUser,
  getCRMCashDepositSummaryByUser
} from "../controllers/NonDepositActualController.js";

const router = express.Router();
router.post("/new-accounts-summary", getNewAccountsSummaryByUser);
router.post("/non-txn-summary", getNauTxnSummaryByUser);
router.post("/activecard", getActiveCardUsersSummaryByUser);
router.post("/eeutransaction", getEeuPaymentsSummaryByUser);
router.post("/getAuditedTxnSummaryByUser", getAuditedTxnSummaryByUser);
router.post("/getDigitalTxnPercentageSummaryByUser", getDigitalTxnPercentageSummaryByUser);
router.post("/getCRMCashDepositSummaryByUser", getCRMCashDepositSummaryByUser);

export default router;
