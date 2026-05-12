import express from "express";
import cors from "cors";
import pool from "./db.js";
// import local route file
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import processRoutes from "./routes/processRoutes.js";
import subProcessRoutes from "./routes/subProcessRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import jobLevelRoutes from "./routes/jobLevelRoutes.js";
import payGradeRoutes from "./routes/payGradeRoutes.js";
import titleRoutes from "./routes/titleRoutes.js";
import pillarRoutes from "./routes/pillarRoutes.js";
import objectiveRoutes from "./routes/objectiveRoutes.js";
import performanceMetricRoutes from "./routes/performanceMetricRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";
import onepageObjectiveRoutes from "./routes/onepageObjectiveRoutes.js";
import onepageKRRoutes from "./routes/onepageKRRoutes.js";
import priorityRoutes from "./routes/priorityRoutes.js";
import targetsRoutes from "./routes/targetsRoutes.js";
import nonDepositTargetRoutes from "./routes/nonDepositTargetRoutes.js";
import accountMappingRoutes from "./routes/accountMappingRoutes.js";
import bauRoutes from "./routes/bauRoutes.js";
import fcyRoutes from "./routes/fcyRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import ifbRoutes from "./routes/ifbRoutes.js";
import branchGradeRoutes from "./routes/branchGradeRoutes.js";
import accountMappingFCYRoutes from "./routes/accountMappingFCYRoutes.js";
import accountSoapRoutes from "./routes/accountSoapRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import NonDepositActualRoutes from "./routes/NonDepositActualRoutes.js";
import quarterOKRRoutes from "./routes/quarterOKRRoutes.js";
import metricUploadRoutes from "./routes/metricUploadRoutes.js";

const app = express();
// Enable CORS
app.use(cors());
app.use(express.json());

// api route
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/subProcess", subProcessRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/job-levels", jobLevelRoutes);
app.use("/api/pay-grades", payGradeRoutes);
app.use("/api/titles", titleRoutes);
app.use("/api/pillars", pillarRoutes);
app.use("/api/objectives", objectiveRoutes);
app.use("/api/performances", performanceMetricRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/onepageobjectives", onepageObjectiveRoutes);
app.use("/api/onepagekr", onepageKRRoutes);
app.use("/api/priorities", priorityRoutes);
app.use("/api/targets", targetsRoutes);
app.use("/api/non-deposit-target", nonDepositTargetRoutes);
app.use("/api/accountmapping", accountMappingRoutes);
app.use("/api/bau", bauRoutes);

app.use("/api/fcy", fcyRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/ifb", ifbRoutes);
app.use("/api/branchgrade", branchGradeRoutes);
app.use("/api/accountmappingfcy", accountMappingFCYRoutes);
//cbs acccount
app.use("/api/cbs", accountSoapRoutes);

// Feedback API
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/nondeposit", NonDepositActualRoutes);
app.use("/api/quarter-okr", quarterOKRRoutes);
app.use("/api/metric-upload", metricUploadRoutes);

// Test DB connection
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("DB connection error:", err));

// Example route
app.get("/", (req, res) => {
  res.send("Hello, PMS Backend!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
