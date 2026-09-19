import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path to the upload folder
const UPLOAD_DIR = path.join(__dirname, "../../uploads/staff-loan-documents");

// Ensure directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Storage: use temp filename first, rename in controller after body is parsed ──
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  // Use a temporary name — controller will rename with proper fields
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `tmp_${Date.now()}${ext}`);
  },
});

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, Word, JPG, and PNG files are allowed"), false);
  }
};

// ── Multer instance ───────────────────────────────────────────────────────────
export const loanDocUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Build the structured filename from known fields ───────────────────────────
export const buildLoanDocFilename = (loanType, fullName, employeeId, originalname) => {
  const sanitize = (str) => (str || "").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const loanPart = sanitize(loanType)   || "Loan";
  const namePart = sanitize(fullName)   || "Unknown";
  const idPart   = sanitize(employeeId) || "000";
  const ext      = path.extname(originalname).toLowerCase();
  return `${loanPart}_${namePart}_${idPart}_${Date.now()}${ext}`;
};

// ── Helper: delete a file by filename ────────────────────────────────────────
export const deleteLoanDocument = (filename) => {
  if (!filename) return;
  const filepath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

// ── Helper: check if file exists ─────────────────────────────────────────────
export const loanDocumentExists = (filename) => {
  if (!filename) return false;
  return fs.existsSync(path.join(UPLOAD_DIR, filename));
};

export { UPLOAD_DIR };
