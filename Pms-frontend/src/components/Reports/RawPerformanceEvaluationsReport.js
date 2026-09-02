import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Box,
  Typography,
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
  TablePagination,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { toast } from "react-toastify";
import { AuthContext } from "../../AuthContext";

const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const COLS = [
  { key: "evaluation_id", label: "Eval ID" },
  { key: "evaluated", label: "Employee Email" },
  { key: "evaluated_full_name", label: "Employee Name" },
  { key: "employee_id", label: "Employee ID" },
  { key: "evaluated_title", label: "Employee Title" },
  { key: "evaluated_position", label: "Position" },
  { key: "evaluator", label: "Evaluator Email" },
  { key: "evaluator_full_name", label: "Evaluator Name" },
  { key: "objective_name", label: "Objective" },
  { key: "metric_name", label: "Metric" },
  { key: "metric_weight", label: "Metric Weight" },
  { key: "cap", label: "Cap" },
  { key: "evaluation_value", label: "Evaluation Value" },
  { key: "weight", label: "Result" },
  { key: "process", label: "Process" },
  { key: "subprocess", label: "Subprocess" },
  { key: "branch", label: "Branch" },
  { key: "status", label: "Status" },
];

const exportToExcelStyled = async (dataRows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Raw Evaluations`);

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
      rowData[c.key] = val;
    });
    const newRow = worksheet.addRow(rowData);
    newRow.eachCell(cell => { cell.border = styles.border; });
  });

  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Raw_Evaluations_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const RawPerformanceEvaluationsReport = () => {
  const { user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const isAdmin = user?.Role === "Admin" || user?.role === "Admin";
  const isHaile = user?.UserName === "hailemariamkssssss";

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchReport = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${baseUrl}/reports/raw-evaluations`, {
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
      });
      setRows(res.data.data || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async () => {
    if (!user) return;
    try {
      setExporting(true);
      const res = await axios.post(`${baseUrl}/reports/raw-evaluations`, {
        user_id: user.UserName,
        position: user.position,
        role: user.role,
        team: user.team,
        subprocess: user.subprocess,
        process: user.process,
        organization: user.organization,
        searchTerm: debouncedSearch,
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

  const handleForceAgree = async () => {
    if (!window.confirm("Are you sure you want to force agree all pending evaluations? This will compute scores and push them to the Evaluation Result table.")) return;
    if (!user) return;
    try {
      setAgreeing(true);
      const res = await axios.post(`${baseUrl}/evaluations/bulk-agree`, {
        created_by: user.MailAdress,
      });
      toast.success(res.data.message || "Force Agree successful!");
      fetchReport();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to force agree");
    } finally {
      setAgreeing(false);
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
    backgroundColor: "#f8fafc",
    color: "#334155",
    borderBottom: "2px solid #e2e8f0"
  };

  const cellSx = {
    py: 1,
    px: 1.5,
    fontSize: "0.8rem",
    whiteSpace: "nowrap"
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 1 }}>
            <AssessmentIcon color="primary" />
            Raw Performance Evaluations
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5, "& .MuiBreadcrumbs-separator": { color: "#94a3b8" } }}>
            <Link underline="hover" color="inherit" href="/">Dashboard</Link>
            <Typography color="text.primary">Reports</Typography>
            <Typography color="text.primary" sx={{ fontWeight: 500 }}>Raw Evaluations</Typography>
          </Breadcrumbs>
        </Box>
        <Stack direction="row" spacing={2}>
          {isHaile && (
            <Button
              variant="contained"
              color="error"
              startIcon={agreeing ? <CircularProgress size={20} color="inherit" /> : <AssignmentTurnedInIcon />}
              onClick={handleForceAgree}
              disabled={agreeing || loading}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
            >
              Force Agree
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={exporting || loading}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, backgroundColor: "#125423", "&:hover": { backgroundColor: "#0d3318" } }}
          >
            Export to Excel
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            size="small"
            placeholder="Search by Employee, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: 300 }, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 350px)" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {COLS.map((col) => (
                  <TableCell key={col.key} sx={headerCellSx}>{col.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COLS.length} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={30} sx={{ color: "#94a3b8" }} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS.length} align="center" sx={{ py: 5, color: "#64748b" }}>
                    No evaluations found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.evaluation_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    {COLS.map((col) => {
                      const value = row[col.key];
                      return (
                        <TableCell key={col.key} sx={cellSx}>
                          {col.key === 'status' ? (
                            <Chip
                              label={value === 'agreed' ? 'Agreed' : 'Pending'}
                              size="small"
                              color={value === 'agreed' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          ) : (
                            value !== null && value !== undefined && value !== "" ? value : "—"
                          )}
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
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: "1px solid #e2e8f0" }}
        />
      </Paper>
    </Box>
  );
};

export default RawPerformanceEvaluationsReport;
