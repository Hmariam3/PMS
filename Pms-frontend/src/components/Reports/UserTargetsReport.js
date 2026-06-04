import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  Box,
  Typography,
  Button,
  Stack,
  Breadcrumbs,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SearchIcon from "@mui/icons-material/Search";
import { AuthContext } from "../../AuthContext";

const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// ─── Column definitions ──────────────────────────────────────────────────────
const USER_COLS = [
  { key: "user_name", label: "Username" },
  { key: "full_name", label: "Full Name" },
  { key: "department", label: "Department" },
  { key: "position", label: "Position" },
  { key: "title", label: "Title" },
  { key: "team", label: "Team" },
  { key: "subprocess", label: "Subprocess" },
  { key: "process", label: "Process" },
  { key: "organization", label: "Organization" },
];

const FIN_COLS = [
  { key: "deposit_target", label: "Deposit Target" },
  { key: "fcy_target", label: "FCY Target" },
  { key: "loan_collection", label: "Loan Collection" },
  { key: "cash_collection", label: "Cash Collection" },
  { key: "cash_deposited_crm", label: "Cash Deposited CRM" },
  { key: "fin_status", label: "Status" },
];

const NONFIN_COLS = [
  { key: "new_account", label: "New Account" },
  { key: "unauthorized_transaction", label: "Unauthorized Txn" },
  { key: "active_card_no", label: "Active Card No" },
  { key: "eeu_transaction_count", label: "EEU Txn Count" },
  { key: "merchant_recruitment", label: "Merchant Recruitment" },
  { key: "merchant_transaction_volume", label: "Merchant Txn Vol" },
  { key: "agent_recruitment", label: "Agent Recruitment" },
  { key: "agent_transaction_volume", label: "Agent Txn Vol" },
  { key: "michu_unique_recruitment", label: "Michu Unique Rec." },
  { key: "digital_transaction_volume", label: "Digital Txn Vol" },
  { key: "coopay_ebirr_activation", label: "CooPay/eBirr Activation" },
  { key: "atm_crm_uptime_rate", label: "ATM/CRM Uptime %" },
  { key: "cash_balance_accuracy_rate", label: "Cash Balance Acc. %" },
  { key: "zero_customer_complaints", label: "Zero Complaints" },
  { key: "avg_txn_per_cso", label: "Avg Txn/CSO" },
  { key: "compliance_rate", label: "Compliance %" },
  { key: "reports_3days_rate", label: "Reports 3-Day %" },
  { key: "audit_report_quality", label: "Audit Quality" },
  { key: "cash_surprise_checks", label: "Cash Surprise Checks" },
  { key: "employee_perf_threshold", label: "Emp Perf Threshold" },
  { key: "transaction_audit_rate", label: "Txn Audit %" },
  { key: "customer_engagement", label: "Customer Engagement" },
  { key: "new_customer_onboarding", label: "New Customer Onboarding" },
  { key: "armingc_deposit_proportion", label: "ARMINGC Deposit Prop." },
  { key: "gl", label: "GL" },
  { key: "nonfin_status", label: "Status" },
];

// ─── Status chip helper ───────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  if (!status) return <span style={{ color: "#94a3b8" }}>—</span>;
  const colors = {
    Approved: { bg: "#dcfce7", color: "#166534" },
    Pending: { bg: "#fef9c3", color: "#854d0e" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
  };
  const c = colors[status] || { bg: "#e2e8f0", color: "#334155" };
  return (
    <Box sx={{
      px: 1, py: 0.3, borderRadius: 1, display: "inline-block",
      bgcolor: c.bg, color: c.color, fontSize: "0.7rem", fontWeight: 700
    }}>
      {status}
    </Box>
  );
};

// ─── Cell value helper ────────────────────────────────────────────────────────
const cellVal = (row, key) => {
  const v = row[key];
  if (v === null || v === undefined || v === "") return "—";
  if (key === "fin_status" || key === "nonfin_status") return <StatusChip status={v} />;
  if (typeof v === "number") return v.toLocaleString();
  return v;
};

// ─── Excel export (Styled with ExcelJS) ───────────────────────────────────────
const exportToExcelStyled = async (rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("User Targets Report");

  // Define styling constants to match the UI
  const styles = {
    userGroup: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } },
    finGroup: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C4A6E' } },
    nonfinGroup: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } },
    userHead: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
    finHead: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } },
    nonfinHead: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } },
    whiteText: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
    darkText: { color: { argb: 'FF334155' }, bold: true, size: 10 },
    blueText: { color: { argb: 'FF0C4A6E' }, bold: true, size: 10 },
    greenText: { color: { argb: 'FF064E3B' }, bold: true, size: 10 },
    border: {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    }
  };

  // 1. Setup Columns
  const allCols = [...USER_COLS, ...FIN_COLS, ...NONFIN_COLS];
  worksheet.columns = allCols.map(c => ({
    header: c.label,
    key: c.key,
    width: 20
  }));

  // 2. Insert Group Header Row (Row 1)
  worksheet.spliceRows(1, 0, []);
  const groupRow = worksheet.getRow(1);
  groupRow.height = 25;

  // Add group labels
  worksheet.getCell('A1').value = '👤 User Information';
  worksheet.getCell(1, USER_COLS.length + 1).value = '💰 Financial Target';
  worksheet.getCell(1, USER_COLS.length + FIN_COLS.length + 1).value = '📊 Non-Financial Target';

  // Merge group header cells
  worksheet.mergeCells(1, 1, 1, USER_COLS.length);
  worksheet.mergeCells(1, USER_COLS.length + 1, 1, USER_COLS.length + FIN_COLS.length);
  worksheet.mergeCells(1, USER_COLS.length + FIN_COLS.length + 1, 1, allCols.length);

  // Style group headers
  const applyGroupStyle = (colStart, colEnd, fill, font) => {
    for (let c = colStart; c <= colEnd; c++) {
      const cell = groupRow.getCell(c);
      cell.fill = fill;
      cell.font = font;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = styles.border;
    }
  };

  applyGroupStyle(1, USER_COLS.length, styles.userGroup, styles.whiteText);
  applyGroupStyle(USER_COLS.length + 1, USER_COLS.length + FIN_COLS.length, styles.finGroup, styles.whiteText);
  applyGroupStyle(USER_COLS.length + FIN_COLS.length + 1, allCols.length, styles.nonfinGroup, styles.whiteText);

  // 3. Style Sub-headers (Row 2)
  const headerRow = worksheet.getRow(2);
  headerRow.height = 22;
  allCols.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.border;
    
    if (idx < USER_COLS.length) {
      cell.fill = styles.userHead;
      cell.font = styles.darkText;
    } else if (idx < USER_COLS.length + FIN_COLS.length) {
      cell.fill = styles.finHead;
      cell.font = styles.blueText;
    } else {
      cell.fill = styles.nonfinHead;
      cell.font = styles.greenText;
    }
  });

  // 4. Add Data
  rows.forEach(r => {
    const rowData = {};
    allCols.forEach(c => {
      let val = r[c.key];
      if (val === null || val === undefined || val === "") val = "—";
      rowData[c.key] = val;
    });
    const newRow = worksheet.addRow(rowData);
    
    // Add basic borders to data cells
    newRow.eachCell(cell => {
      cell.border = styles.border;
    });
  });

  // Freeze top 2 rows (headers)
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  // 5. Generate and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `User_Targets_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ─── Component ────────────────────────────────────────────────────────────────
const UserTargetsReport = () => {
  const { user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.post(`${baseUrl}/reports/user-targets`, {
          user_id: user?.UserName,
          position: user?.position,
          role: user?.role,
          team: user?.team,
          subprocess: user?.subprocess,
          process: user?.process,
        });
        setRows(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [user]);

  // Filter rows by search term
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calculate has targets for chip counts using the filtered list
  const hasFinTarget = (row) => row.fin_target_id !== null && row.fin_target_id !== undefined;
  const hasNonFinTarget = (row) => row.nonfin_target_id !== null && row.nonfin_target_id !== undefined;

  const headerCellSx = {
    fontWeight: 700,
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
    py: 1,
    px: 1.5,
    borderBottom: "2px solid #e2e8f0",
  };

  const bodyCellSx = {
    fontSize: "0.78rem",
    py: 0.8,
    px: 1.5,
    whiteSpace: "nowrap",
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Page header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <AssessmentIcon sx={{ color: "#0ea5e9" }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
              User Targets Report
            </Typography>
          </Stack>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" href="/">Dashboard</Link>
            <Typography color="text.primary">Reports</Typography>
            <Typography color="text.primary">User Targets</Typography>
          </Breadcrumbs>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0); // Reset page on search
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "#fff", width: 250 }}
          />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => exportToExcelStyled(filteredRows)}
            disabled={filteredRows.length === 0 || loading}
            sx={{
              bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" },
              textTransform: "none", fontWeight: 600, borderRadius: 2,
            }}
          >
            Download Excel
          </Button>
        </Stack>
      </Stack>

      {/* ── Summary chips ── */}
      {!loading && !error && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Chip label={`${filteredRows.length} Users`} color="primary" size="small" />
          <Chip label={`${filteredRows.filter(hasFinTarget).length} with Financial Target`} color="success" size="small" />
          <Chip label={`${filteredRows.filter(r => !hasFinTarget(r)).length} without Financial Target`} color="warning" size="small" />
          <Chip label={`${filteredRows.filter(hasNonFinTarget).length} with Non-Financial Target`} color="info" size="small" />
          <Chip label={`${filteredRows.filter(r => !hasNonFinTarget(r)).length} without Non-Financial Target`} color="warning" size="small" />
          <Chip label={`${filteredRows.filter(r => !hasFinTarget(r) && !hasNonFinTarget(r)).length} without any Target`} color="error" size="small" />
        </Stack>
      )}

      {/* ── States ── */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {/* ── Table ── */}
      {!loading && !error && (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: "70vh", overflowX: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                {/* ── Group header row ── */}
                <TableRow>
                  <TableCell
                    colSpan={USER_COLS.length}
                    sx={{
                      ...headerCellSx, bgcolor: "#1e293b", color: "#fff",
                      textAlign: "center", borderRight: "2px solid #334155"
                    }}
                  >
                    👤 User Information
                  </TableCell>
                  <TableCell
                    colSpan={FIN_COLS.length}
                    sx={{
                      ...headerCellSx, bgcolor: "#0c4a6e", color: "#fff",
                      textAlign: "center", borderRight: "2px solid #0369a1"
                    }}
                  >
                    💰 Financial Target
                  </TableCell>
                  <TableCell
                    colSpan={NONFIN_COLS.length}
                    sx={{
                      ...headerCellSx, bgcolor: "#064e3b", color: "#fff",
                      textAlign: "center"
                    }}
                  >
                    📊 Non-Financial Target
                  </TableCell>
                </TableRow>

                {/* ── Column header row ── */}
                <TableRow>
                  {USER_COLS.map((c, i) => (
                    <TableCell
                      key={c.key}
                      sx={{
                        ...headerCellSx, bgcolor: "#f1f5f9", color: "#334155",
                        borderRight: i === USER_COLS.length - 1 ? "2px solid #cbd5e1" : undefined
                      }}
                    >
                      {c.label}
                    </TableCell>
                  ))}
                  {FIN_COLS.map((c, i) => (
                    <TableCell
                      key={c.key}
                      sx={{
                        ...headerCellSx, bgcolor: "#e0f2fe", color: "#0c4a6e",
                        borderRight: i === FIN_COLS.length - 1 ? "2px solid #7dd3fc" : undefined
                      }}
                    >
                      {c.label}
                    </TableCell>
                  ))}
                  {NONFIN_COLS.map((c) => (
                    <TableCell
                      key={c.key}
                      sx={{ ...headerCellSx, bgcolor: "#d1fae5", color: "#064e3b" }}
                    >
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={USER_COLS.length + FIN_COLS.length + NONFIN_COLS.length}
                      align="center" sx={{ py: 6, color: "#94a3b8" }}>
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                    <TableRow
                      key={row.user_name + idx}
                      hover
                      sx={{
                        bgcolor: idx % 2 === 0 ? "#fff" : "#f8fafc",
                        "&:hover": { bgcolor: "#f0f9ff" },
                      }}
                    >
                      {/* User info cells */}
                      {USER_COLS.map((c, i) => (
                        <TableCell
                          key={c.key}
                          sx={{
                            ...bodyCellSx,
                            borderRight: i === USER_COLS.length - 1 ? "2px solid #cbd5e1" : undefined,
                            fontWeight: c.key === "user_name" ? 600 : 400
                          }}
                        >
                          {row[c.key] || "—"}
                        </TableCell>
                      ))}

                      {/* Financial target cells */}
                      {FIN_COLS.map((c, i) => (
                        <Tooltip
                          key={c.key}
                          title={!hasFinTarget(row) ? "No financial target registered" : ""}
                        >
                          <TableCell
                            sx={{
                              ...bodyCellSx,
                              color: !hasFinTarget(row) ? "#94a3b8" : "inherit",
                              borderRight: i === FIN_COLS.length - 1 ? "2px solid #7dd3fc" : undefined
                            }}
                          >
                            {cellVal(row, c.key)}
                          </TableCell>
                        </Tooltip>
                      ))}

                      {/* Non-financial target cells */}
                      {NONFIN_COLS.map((c) => (
                        <Tooltip
                          key={c.key}
                          title={!hasNonFinTarget(row) ? "No non-financial target registered" : ""}
                        >
                          <TableCell
                            sx={{
                              ...bodyCellSx,
                              color: !hasNonFinTarget(row) ? "#94a3b8" : "inherit"
                            }}
                          >
                            {cellVal(row, c.key)}
                          </TableCell>
                        </Tooltip>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default UserTargetsReport;
