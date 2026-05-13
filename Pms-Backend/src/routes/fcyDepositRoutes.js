import express from "express";
import {
  getAllFcyDeposits,
  getFcyDepositsByUser,
  createFcyDeposit,
  updateFcyDeposit,
  deleteFcyDeposit,
  approveFcyDeposit,
} from "../controllers/fcyDepositController.js";

const router = express.Router();

router.get("/", getAllFcyDeposits);
router.post("/getFcyDepositsByUser", getFcyDepositsByUser);
router.post("/", createFcyDeposit);
router.put("/:id", updateFcyDeposit);
router.delete("/:id", deleteFcyDeposit);
router.put("/approve/:id", approveFcyDeposit);

export default router;
