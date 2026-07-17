import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Box,
  Typography,
  Stack,
  Breadcrumbs,
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
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from '@mui/icons-material/FilterList';
import { AuthContext } from "../../AuthContext";

const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const COLS = [
  // { key: "fcy_id", label: "ID" },
  { key: "full_name", label: "Full Name" },
  { key: "title", label: "Title" },
  { key: "account_number", label: "Account Number" },
  { key: "account_holder", label: "Account Holder" },
  { key: "amount", label: "Amount" },
  { key: "reference", label: "Reference" },
  { key: "created_at", label: "Created Date" },
  { key: "process", label: "Process" },
  { key: "subprocess", label: "Subprocess" },
  { key: "team", label: "Team" },
  { key: "status", label: "Status" },
  { key: "createdby", label: "Created By" },
  { key: "approvedby", label: "Approved By" },
  { key: "is_shared", label: "Is Shared" }
];

const exportToExcelStyled = async (dataRows, districtName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`FCY Deposit Report`);

  const styles = {
    header: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C4A6E' } },
    whiteText: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
    border: {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    }
  };

  worksheet.columns = COLS.map(c => ({
    header: c.label,
    key: c.key,
    width: 20
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  COLS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = styles.header;
    cell.font = styles.whiteText;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = styles.border;
  });

  dataRows.forEach(r => {
    const rowData = {};
    COLS.forEach(c => {
      let val = r[c.key];
      if (val === null || val === undefined || val === "") val = "—";
      // Ensure boolean shows as text
      if (typeof val === 'boolean') val = val ? "Yes" : "No";
      // Format date if needed
      if (c.key === "created_at" && val !== "—") {
        val = new Date(val).toLocaleDateString();
      }
      rowData[c.key] = val;
    });
    const newRow = worksheet.addRow(rowData);
    newRow.eachCell(cell => { cell.border = styles.border; });
  });

  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `FCY_Deposit_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const FcyDepositReport = () => {
  const { user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterProcess, setFilterProcess] = useState("");
  const [filterSubprocess, setFilterSubprocess] = useState("");
  const [filterTeam, setFilterTeam] = useState("");

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchReport = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${baseUrl}/reports/fcy-deposit`, {
        user_id: user.UserName,
        position: user.position,
        role: user.role,
        team: user.team,
        subprocess: user.subprocess,
        process: user.process,
        organization: user.organization,
        page,
        limit: rowsPerPage,
        searchTerm: debouncedSearch,
        filterProcess,
        filterSubprocess,
        filterTeam
      });
      setRows(res.data.data || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, debouncedSearch, filterProcess, filterSubprocess, filterTeam]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async () => {
    if (!user) return;
    try {
      setExporting(true);
      const res = await axios.post(`${baseUrl}/reports/fcy-deposit`, {
        user_id: user.UserName,
        position: user.position,
        role: user.role,
        team: user.team,
        subprocess: user.subprocess,
        process: user.process,
        organization: user.organization,
        searchTerm: debouncedSearch,
        filterProcess,
        filterSubprocess,
        filterTeam,
        isExport: true
      });
      const fullData = res.data.data || [];
      await exportToExcelStyled(fullData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const headerCellSx = {
    fontWeight: 700,
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
    py: 1.5,
    px: 1.5,
    bgcolor: "#f8fafc",
    color: "#334155",
    borderBottom: "2px solid #e2e8f0",
  };

  const bodyCellSx = {
    fontSize: "0.8rem",
    py: 1,
    px: 1.5,
    whiteSpace: "nowrap",
  };



  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <AssessmentIcon sx={{ color: "#0ea5e9" }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
              FCY Deposit Report
            </Typography>
          </Stack>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Reports</Typography>
            <Typography color="text.primary">FCY Deposit</Typography>
          </Breadcrumbs>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={exporting || totalCount === 0}
            sx={{
              bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" },
              textTransform: "none", fontWeight: 600, borderRadius: 2,
            }}
          >
            Download Data
          </Button>

          <TextField
            size="small"
            placeholder="Filter by Process"
            value={filterProcess}
            onChange={(e) => { setFilterProcess(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "#fff", width: 180 }}
          />
          <TextField
            size="small"
            placeholder="Filter by Subprocess"
            value={filterSubprocess}
            onChange={(e) => { setFilterSubprocess(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "#fff", width: 180 }}
          />
          <TextField
            size="small"
            placeholder="Filter by Team"
            value={filterTeam}
            onChange={(e) => { setFilterTeam(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "#fff", width: 180 }}
          />

          <TextField
            size="small"
            placeholder="Search account, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "#fff", width: 250 }}
          />
        </Stack>
      </Stack>

      {!loading && !error && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Chip label={`Total Records: ${totalCount.toLocaleString()}`} color="primary" size="small" sx={{ fontWeight: 600 }} />
          {filterProcess && <Chip label={`Process: ${filterProcess}`} color="info" size="small" onDelete={() => { setFilterProcess(""); setPage(0); }} />}
          {filterSubprocess && <Chip label={`Subprocess: ${filterSubprocess}`} color="info" size="small" onDelete={() => { setFilterSubprocess(""); setPage(0); }} />}
          {filterTeam && <Chip label={`Team: ${filterTeam}`} color="info" size="small" onDelete={() => { setFilterTeam(""); setPage(0); }} />}
          {debouncedSearch && <Chip label={`Search: ${debouncedSearch}`} color="info" size="small" onDelete={() => { setSearchTerm(""); setPage(0); }} />}
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", position: "relative", minHeight: 300 }}>
        {loading && (
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.7)", zIndex: 10 }}>
            <CircularProgress />
          </Box>
        )}
        <TableContainer sx={{ maxHeight: "65vh", overflowX: "auto" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {COLS.map((c) => (
                  <TableCell key={c.key} sx={headerCellSx}>
                    {c.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && !loading && !error ? (
                <TableRow>
                  <TableCell colSpan={COLS.length} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={row.fcy_id || idx}
                    hover
                    sx={{
                      bgcolor: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      "&:hover": { bgcolor: "#f0f9ff" },
                    }}
                  >
                    {COLS.map((c) => (
                      <TableCell
                        key={c.key}
                        sx={{
                          ...bodyCellSx,
                          fontWeight: c.key === "account_number" ? 600 : 400,
                          color: c.key === "account_number" ? "#0369a1" : "inherit"
                        }}
                      >
                        {c.key === "created_at" && row[c.key] ? new Date(row[c.key]).toLocaleDateString() :
                          c.key === "is_shared" ? (row[c.key] ? "Yes" : "No") :
                            (row[c.key] !== null && row[c.key] !== undefined ? row[c.key].toString() : "—")}
                      </TableCell>
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
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default FcyDepositReport;
