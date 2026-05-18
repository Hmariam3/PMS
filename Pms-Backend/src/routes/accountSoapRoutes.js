import express from "express";
import {
  getAccountBalance,
  getUserInfo,
  getLoanDetail,
} from "../controllers/accountSoapController.js";

const router = express.Router();

router.post("/account-balance", getAccountBalance);
router.post("/user-info", getUserInfo);
router.post("/loan-detail", getLoanDetail);

export default router;
