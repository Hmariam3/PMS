import express from "express";
import {
  getAccountBalance,
  getUserInfo,
  getLoanDetail,
  getMMReferenceDetail,
} from "../controllers/accountSoapController.js";

const router = express.Router();

router.post("/account-balance", getAccountBalance);
router.post("/user-info", getUserInfo);
router.post("/loan-detail", getLoanDetail);
router.post("/mm-reference-detail", getMMReferenceDetail);

export default router;
