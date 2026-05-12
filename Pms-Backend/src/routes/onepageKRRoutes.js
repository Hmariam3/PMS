import express from "express";
import {
  getAllKR,
  getKRById,
  createKR,
  updateKR,
  deleteKR,
  getOkrByUser,

} from "../controllers/onepageKRController.js";

const router = express.Router();
router.get("/", getAllKR);
router.get("/:id", getKRById);
router.post("/", createKR);
router.post("/getOkrByUser/", getOkrByUser);
router.put("/:id", updateKR);
router.delete("/:id", deleteKR);

export default router;