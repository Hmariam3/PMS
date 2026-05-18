import express from "express";
import {
   getAllLoanCollections,
   getLoanById,
   createLoan,
   updateLoan,
   deleteLoan,
   getLoanByUser,
   getLoanBalanceDifferenceByUser,
   getLoanBalanceDifferenceByUserMapped,

} from "../controllers/loanController.js";

const router = express.Router();

/* =========================
   CRUD ROUTES
========================= */
router.get("/", getAllLoanCollections);
router.get("/:id", getLoanById);
router.post("/", createLoan);
router.post("/loanBalanceDifference/", getLoanBalanceDifferenceByUser);
router.post("/loanBalanceDifferenceMapped/", getLoanBalanceDifferenceByUserMapped);
router.put("/:id", updateLoan);
router.delete("/:id", deleteLoan);

/* =========================
   ROLE BASED ROUTE
========================= */
router.post("/getLoanByUser", getLoanByUser);

export default router;
