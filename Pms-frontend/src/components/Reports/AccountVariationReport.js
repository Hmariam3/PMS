import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Backdrop,
  Breadcrumbs,
  Stack,
  TextField,
  InputAdornment,
  Button,
  TablePagination
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { AuthContext } from "../../AuthContext";
import { toast } from "react-toastify";

const a11yProps = (index) => {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
};

const AccountVariationReport = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Quarter progress — targets shown "as of today" are pro-rated by this
  const getQuarterRatio = () => {
    const start = new Date("2026-07-01");
    const today = new Date();
    const days = Math.floor((today - start) / 86_400_000) + 1;
    return Math.max(0, Math.min(days, 90)) / 90;
  };
  const quarterRatio = getQuarterRatio();

  // Data states
  const [localData, setLocalData] = useState([]);
  const [fcyData, setFcyData] = useState([]);
  const [loanData, setLoanData] = useState([]);
  const [fcyGenData, setFcyGenData] = useState([]);
  const [manualCashData, setManualCashData] = useState([]);
  const [loanCollectionBranchData, setLoanCollectionBranchData] = useState([]);

  // Pagination & Search
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const fetchReportData = async (tabType) => {
    try {
      setLoading(true);
      const requestData = {
        user_id: user.UserName,
        position: user.position,
        role: user.role,
        team: user.team,
        subprocess: user.subprocess,
        process: user.process,
        organization: user.organization,
        tabType: tabType
      };

      const res = await axios.post(`${baseUrl}/reports/account-variation`, requestData);
      switch (tabType) {
        case "local": setLocalData(res.data); break;
        case "fcy": setFcyData(res.data); break;
        case "loan": setLoanData(res.data); break;
        case "fcy-gen": setFcyGenData(res.data); break;
        case "manual-cash": setManualCashData(res.data); break;
        case "loan-collection-branch": setLoanCollectionBranchData(res.data); break;
        default: break;
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to fetch ${tabType} report`);
    } finally {
      setLoading(false);
    }
  };

  // Tab order → backend tabType
  const tabTypes = ["local", "fcy-gen", "loan-collection-branch", "manual-cash", "loan", "fcy"];

  useEffect(() => {
    const type = tabTypes[tabValue];
    if (type === "local" && localData.length === 0) fetchReportData("local");
    else if (type === "fcy" && fcyData.length === 0) fetchReportData("fcy");
    else if (type === "loan" && loanData.length === 0) fetchReportData("loan");
    else if (type === "fcy-gen" && fcyGenData.length === 0) fetchReportData("fcy-gen");
    else if (type === "manual-cash" && manualCashData.length === 0) fetchReportData("manual-cash");
    else if (type === "loan-collection-branch" && loanCollectionBranchData.length === 0) fetchReportData("loan-collection-branch");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    setSearchTerm("");
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ─── Styling ────────────────────────────────────────────────────────────────
  const headerCellSx = {
    fontWeight: 700,
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
    py: 1,
    px: 1.5,
    bgcolor: "#1e293b",
    color: "#fff",
    borderRight: "1px solid #334155"
  };

  const bodyCellSx = {
    fontSize: "0.78rem",
    py: 0.8,
    px: 1.5,
    whiteSpace: "nowrap",
    borderRight: "1px solid #cbd5e1"
  };

  // ─── Table Configs ──────────────────────────────────────────────────────────
  const tablesConfig = [
    {
      title: "Local Account Achievement",
      type: "local",
      data: localData,
      cols: [
        { key: "user_name", label: "User Name" },
        { key: "full_name", label: "Full Name" },
        { key: "position", label: "Position" },
        { key: "title", label: "Title" },
        { key: "process", label: "Process" },
        { key: "subprocess", label: "Subprocess" },
        { key: "branch", label: "Branch" },
        { key: "mapped_accounts_count", label: "Accounts Count" },
        { key: "total_beginning_balance", label: "Beginning Balance" },
        { key: "total_current_balance", label: "Current Balance" },
        { key: "deposit_target", label: "Deposit Target" },
        { key: "deposit_target_today", label: "Deposit Target (Today)" },
        { key: "variation", label: "Achievement Amount" },
        { key: "variation_percent", label: "Achievement Percentage" }
      ]
    },
    {
      title: "FCY Generation",
      type: "fcy-gen",
      data: fcyGenData,
      cols: [
        { key: "user_name", label: "User Name" },
        { key: "full_name", label: "Full Name" },
        { key: "position", label: "Position" },
        { key: "title", label: "Title" },
        { key: "process", label: "Process" },
        { key: "subprocess", label: "Subprocess" },
        { key: "branch", label: "Branch" },
        { key: "fcy_generation_count", label: "FCY Gen Count" },
        { key: "fcy_target", label: "FCY Target" },
        { key: "fcy_target_today", label: "FCY Target (Today)" },
        { key: "total_amount", label: "Achievement Amount" },
        { key: "achievement_percent", label: "Achievement Percentage" }
      ]
    },
    {
      title: "Loan Collection Per Branch",
      type: "loan-collection-branch",
      data: loanCollectionBranchData,
      cols: [
        { key: "PROCESS", label: "Process" },
        { key: "SUBPROCESS", label: "Subprocess" },
        { key: "BRANCH_NAME", label: "Branch Name" },
        { key: "CO_CODE", label: "CO Code" },
        { key: "TOTAL_COLLECTION", label: "Total Collection" }
        // { key: "LOAN_DUE_COLLECTION", label: "Loan Due Collection" },
      ]
    },
    {
      title: "Manual Cash Collection per Branch",
      type: "manual-cash",
      data: manualCashData,
      cols: [
        // { key: "DISTRICT_NAME", label: "District Name" },
        { key: "PROCESS", label: "Process" },
        { key: "SUBPROCESS", label: "Subprocess" },
        { key: "BRANCH_NAME", label: "Branch Name" },
        { key: "BRANCH_CODE", label: "Branch Code" },
        { key: "TOTAL_CASH_CREDIT", label: "Total Cash Credit" },

      ]
    },
    {
      title: "Mapped Loan Account Achievement",
      type: "loan",
      data: loanData,
      cols: [
        { key: "user_name", label: "User Name" },
        { key: "full_name", label: "Full Name" },
        { key: "position", label: "Position" },
        { key: "title", label: "Title" },
        { key: "process", label: "Process" },
        { key: "subprocess", label: "Subprocess" },
        { key: "branch", label: "Branch" },
        { key: "loan_accounts_count", label: "Accounts Count" },
        { key: "loan_collection_target", label: "Loan Collection Target" },
        { key: "loan_collection_target_today", label: "Loan Collection Target (Today)" },
        { key: "total_collected_balance", label: "Achievement Amount" },
        { key: "achievement_percent", label: "Achievement Percentage" },
        { key: "total_outstanding_balance", label: "Total Outstanding" }
      ]
    },
    {
      title: "Mapped FCY Account Achievement",
      type: "fcy",
      data: fcyData,
      cols: [
        { key: "user_name", label: "User Name" },
        { key: "full_name", label: "Full Name" },
        { key: "position", label: "Position" },
        { key: "title", label: "Title" },
        { key: "process", label: "Process" },
        { key: "subprocess", label: "Subprocess" },
        { key: "branch", label: "Branch" },
        { key: "mapped_accounts_count", label: "Accounts Count" },
        { key: "total_beginning_balance", label: "Beginning Balance" },
        { key: "total_current_balance", label: "Current Balance" },
        { key: "total_lcy_closing_balance", label: "Achievement (LCY Closing)" }
      ]
    }
  ];

  const currentConfig = tablesConfig[tabValue];

  // Map Data — per-tab achievement calculations against the target as of today
  const mappedData = currentConfig.data.map(row => {
    let newRow = { ...row };
    if (currentConfig.type === "local") {
      // Deposit target pro-rated to today (quarter target × days elapsed / 90)
      const todayTarget = (Number(row.deposit_target) || 0) * quarterRatio;
      newRow.deposit_target_today = todayTarget;

      if (row.total_beginning_balance === null && row.total_current_balance === null) {
        newRow.variation = null;
        newRow.variation_percent = null;
      } else {
        const beg = Number(row.total_beginning_balance) || 0;
        const cur = Number(row.total_current_balance) || 0;
        const varAmt = Number(row.variation) || (cur - beg);
        // Achievement % is measured against the target as of today
        const varPct = todayTarget === 0 ? (varAmt > 0 ? 100 : 0) : (varAmt / todayTarget) * 100;
        newRow.variation = varAmt;
        newRow.variation_percent = `${varPct.toFixed(2)}%`;
      }
    } else if (currentConfig.type === "fcy-gen") {
      const todayTarget = (Number(row.fcy_target) || 0) * quarterRatio;
      newRow.fcy_target_today = todayTarget;
      const achv = Number(row.total_amount) || 0;
      const pct = todayTarget === 0 ? (achv > 0 ? 100 : 0) : (achv / todayTarget) * 100;
      newRow.achievement_percent = `${pct.toFixed(2)}%`;
    } else if (currentConfig.type === "loan") {
      const todayTarget = (Number(row.loan_collection_target) || 0) * quarterRatio;
      newRow.loan_collection_target_today = todayTarget;
      const achv = Number(row.total_collected_balance) || 0;
      const pct = todayTarget === 0 ? (achv > 0 ? 100 : 0) : (achv / todayTarget) * 100;
      newRow.achievement_percent = `${pct.toFixed(2)}%`;
    }
    return newRow;
  });

  // Filter Data
  const filteredRows = mappedData.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ─── Aggregate strip (Local / FCY Generation / Mapped Loan tabs) ────────────
  // Sums over the individual rows currently shown in the table.
  const AGG_CONFIG = {
    local: {
      targetKey: "deposit_target", todayKey: "deposit_target_today", achievementKey: "variation",
      targetLabel: "Aggregate Deposit Target", todayLabel: "Aggregate Deposit Target (Today)",
    },
    "fcy-gen": {
      targetKey: "fcy_target", todayKey: "fcy_target_today", achievementKey: "total_amount",
      targetLabel: "Aggregate FCY Target", todayLabel: "Aggregate FCY Target (Today)",
    },
    loan: {
      targetKey: "loan_collection_target", todayKey: "loan_collection_target_today", achievementKey: "total_collected_balance",
      targetLabel: "Aggregate Loan Collection Target", todayLabel: "Aggregate Loan Collection Target (Today)",
    },
  };
  const aggDef = AGG_CONFIG[currentConfig.type];
  const aggregates = aggDef
    ? (() => {
        // Branch Managers / Eco-Micro MOMs and District Directors set the
        // targets of their branches / districts, so their rows duplicate the
        // targets (and mapped achievements) of the staff below them. For the
        // aggregates only the accountable individual rows count — position
        // CRM or Individual — the table itself stays unfiltered.
        const aggRows = filteredRows.filter(
          (r) => r.position === "CRM" || r.position === "Individual"
        );
        const target = aggRows.reduce((s, r) => s + (Number(r[aggDef.targetKey]) || 0), 0);
        const targetToday = aggRows.reduce((s, r) => s + (Number(r[aggDef.todayKey]) || 0), 0);
        const achievement = aggRows.reduce((s, r) => s + (Number(r[aggDef.achievementKey]) || 0), 0);
        const percent = targetToday !== 0
          ? (achievement / targetToday) * 100
          : (achievement > 0 ? 100 : 0);
        return { target, targetToday, achievement, percent };
      })()
    : null;
  const fmtAgg = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const aggPercentColor = (p) =>
    p >= 100 ? "success.main" : p >= 75 ? "warning.main" : "error.main";

  // ─── Excel Export ───────────────────────────────────────────────────────────
  const exportToExcelStyled = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(currentConfig.title);

    const styles = {
      headRow: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } },
      whiteText: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
      border: {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      }
    };

    worksheet.columns = currentConfig.cols.map(c => ({
      header: c.label,
      key: c.key,
      width: 20
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    currentConfig.cols.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.fill = styles.headRow;
      cell.font = styles.whiteText;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = styles.border;
    });

    filteredRows.forEach(r => {
      const rowData = {};
      currentConfig.cols.forEach(c => {
        let val = r[c.key];
        if (val === null || val === undefined || val === "") val = "—";
        if (typeof val === "number") val = val; // let excel format it, or leave as string
        rowData[c.key] = val;
      });
      const newRow = worksheet.addRow(rowData);
      newRow.eachCell(cell => {
        cell.border = styles.border;
      });
    });

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${currentConfig.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Page header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <AssessmentIcon sx={{ color: "#0ea5e9" }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
              Financial Achievement Report
            </Typography>
          </Stack>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Reports</Typography>
            <Typography color="text.primary">Financial Achievement</Typography>
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
            onClick={exportToExcelStyled}
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

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="Variation Report Tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Local Account Achievement" {...a11yProps(0)} />
            <Tab label="FCY Generation" {...a11yProps(1)} />
            <Tab label="Loan Collection Per Branch" {...a11yProps(2)} />
            <Tab label="Manual Cash Collection per Branch" {...a11yProps(3)} />
            <Tab label="Mapped Loan Account Achievement" {...a11yProps(4)} />
            <Tab label="Mapped FCY Account Achievement" {...a11yProps(5)} />
          </Tabs>
        </Box>

        {/* ── Aggregate strip — sums of the individual rows shown in the table ── */}
        {aggDef && aggregates && (
          <Box sx={{ display: "flex", gap: 2, p: 2, flexWrap: { xs: "wrap", md: "nowrap" }, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            {[
              { label: aggDef.targetLabel, value: fmtAgg(aggregates.target), color: "#1e293b" },
              { label: aggDef.todayLabel, value: fmtAgg(aggregates.targetToday), color: "#1d4ed8" },
              {
                label: "Aggregate Achievement Amount",
                value: fmtAgg(aggregates.achievement),
                color: aggregates.achievement >= 0 ? "success.main" : "error.main",
              },
              {
                label: "Aggregate Achievement Percentage",
                value: `${aggregates.percent.toFixed(2)}%`,
                color: aggPercentColor(aggregates.percent),
              },
            ].map((card) => (
              <Box
                key={card.label}
                sx={{
                  flex: "1 1 0", minWidth: 0,
                  px: 2, py: 1.5,
                  bgcolor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, display: "block", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography variant="subtitle1" fontWeight="800" sx={{ color: card.color, lineHeight: 1.3 }}>
                  {card.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: "70vh", overflowX: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {currentConfig.cols.map((c, i) => (
                    <TableCell key={c.key} sx={{
                      ...headerCellSx,
                      borderRight: i === currentConfig.cols.length - 1 ? "none" : headerCellSx.borderRight
                    }}>
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentConfig.cols.length} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                    <TableRow
                      key={idx}
                      hover
                      sx={{
                        bgcolor: idx % 2 === 0 ? "#fff" : "#f8fafc",
                        "&:hover": { bgcolor: "#f0f9ff" },
                      }}
                    >
                      {currentConfig.cols.map((c, i) => {
                        let val = row[c.key];
                        if (val === null || val === undefined || val === "") val = "—";
                        else if (/^-?\d+(\.\d+)?$/.test(String(val).trim())) {
                          // numeric values (numbers or numeric strings from the
                          // API) render comma-separated
                          val = Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
                        }

                        let color = "inherit";
                        let fontWeight = 400;
                        if (c.key === "variation") {
                          color = row[c.key] >= 0 ? "success.main" : "error.main";
                          fontWeight = "bold";
                        } else if (c.key === "variation_percent" || c.key === "achievement_percent") {
                          color = parseFloat(row[c.key]) >= 0 ? "success.main" : "error.main";
                          fontWeight = "bold";
                        } else if (c.key === "total_lcy_closing_balance" || c.key === "total_collected_balance" || c.key === "total_amount") {
                          color = "success.main";
                          fontWeight = "bold";
                        }

                        return (
                          <TableCell key={c.key} sx={{
                            ...bodyCellSx,
                            color,
                            fontWeight,
                            borderRight: i === currentConfig.cols.length - 1 ? "none" : bodyCellSx.borderRight
                          }}>
                            {val}
                          </TableCell>
                        );
                      })}
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
        </Box>
      </Paper>

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default AccountVariationReport;
