// backend/routes/employeeRoutes.js
import express from "express";
import multer from "multer";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeesFromExcel,
  downloadEmployeeTemplate,
  getEmployeeTitleByEmail,
  getMyTeamBySupervisor,
  searchEmployees,
} from "../controllers/employeeController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp folder for uploads

router.get("/template", downloadEmployeeTemplate);
router.get("/search", searchEmployees);
router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.post("/createEmployee", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
// router.get("/title/email/:email", getEmployeeTitleByEmail);
router.get("/title/email", getEmployeeTitleByEmail);
router.get("/myTeam/:supervisor_email", getMyTeamBySupervisor);
// New Excel upload endpoint
router.post("/upload", upload.single("file"), uploadEmployeesFromExcel);

export default router;
