import express from "express";
import {
  getAccountBalance,
  getUserInfo,
} from "../controllers/accountSoapController.js";

const router = express.Router();

router.post("/account-balance", getAccountBalance);
router.post("/user-info", getUserInfo);

export default router;
