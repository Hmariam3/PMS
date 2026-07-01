import React, { useState, useContext, useEffect } from "react";
import { Box, Typography, useTheme, useMediaQuery, Divider, Stack, Grid, Card, CardContent, Avatar, Chip, Paper, LinearProgress } from "@mui/material";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import { toast } from "react-toastify";
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [krs, setKrs] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [accountBalace, setAccountBalace] = useState([]);
  const [ifbBalace, setifbBalace] = useState([]);
  const [userTarget, setuserTarget] = useState([]);
  const [userLoanTarget, setuserLoanTarget] = useState([]);
  const [usernondepositTarget, setuserNonDepositTarget] = useState([]);
  const [achievementRateDeposit, setAchievementRateDeposit] = useState(0);
  const [achievmentSpecialMentionLoan, setAchievmentSpecialMentionLoan] = useState(0);


  const [userFcy, setuserFcy] = useState([]);
  const [userLoan, setuserLoan] = useState([]);
  const [achievementRateFcy, setAchievementRateFcy] = useState(0);
  const [achievementRateLoan, setAchievementRateLoan] = useState(0);
  const [achievementRateAccount, setAchievementRateAccount] = useState(0);
  const [achievementRateunauthorizedTran, setAchievementRateunauthorizedTran] =
    useState(0);

  const [achievementActivecard, setachievementActivecard] = useState(0);
  const [achievementEeu, setachievementEeu] = useState(0);
  const [achievementdistrictDeposit, setachievementdistrictDeposit] = useState(0);
  const [bauData, setBauData] = useState([]);
  const [quarterOkrData, setQuarterOkrData] = useState([]);

  const fetchData = async () => {
    if (!user) return;

    const requestData = {
      user_id: user.UserName,
      username: user.UserName,
      user_name: user.UserName,
      position: user.position,
      process: user.process || null,
      subprocess: user.subprocess || null,
      team: user.team || null,
      cbsusername: user.cbsusername || null,
    };

    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

    // Helper to safely fetch and set state
    const safeFetch = async (url, setter, label) => {
      try {
        const res = await axios.post(url, requestData);
        setter(res.data);
      } catch (err) {
        console.error(`Error fetching ${label}:`, err);
        // Don't show toast for every small failure to avoid spam
      }
    };

    try {
      // Fetch core data in parallel
      // KR
      const krRes = await axios.post(
        `${baseUrl}/onepagekr/getOkrByUser`,
        requestData
      );

      setKrs(krRes.data);

      // Objectives
      const objectiveRes = await axios.post(
        `${baseUrl}/onepageobjectives/by-user`,
        requestData
      );

      setObjectives(objectiveRes.data);

      // Priorities
      const priorityRes = await axios.post(
        `${baseUrl}/priorities/getPriorityByUser`,
        requestData
      );

      setPriorities(priorityRes.data);

      // BAU
      const bauRes = await axios.post(
        `${baseUrl}/bau/user`,
        requestData
      );

      setBauData(bauRes.data);

      // Quarter OKR
      const quarterOkrRes = await axios.post(
        `${baseUrl}/quarter-okr/user`,
        requestData
      );

      setQuarterOkrData(quarterOkrRes.data);

      // User Target from tareget tabel and api
      const userTargetRes = await axios.post(
        `${baseUrl}/targets/TargetsSummary/`,
        requestData,
      );
      setuserTarget(userTargetRes.data);

      const LoantargetRes = await axios.post(
        `${baseUrl}/targets/loanCollectionTargetByUser/`,
        requestData
      );
      setuserLoanTarget(LoantargetRes.data);

      let totalLoanTarget = 0;
      if (user.process === "Interest Free Banking" || user.process === "Agri and Cooperative Business" || (user.process === "Growth and Operations" && user.organization === "Ho")) {
        //for crm and Ho
        totalLoanTarget = Number(userTargetRes.data.total_loan) || 0;
      } else {
        //for branch users 
        totalLoanTarget = Number(LoantargetRes.data.loan_collection) || 0;
      }

      let accountBalaceActual = 0;
      // for deposit
      let achievementRate = 0;
      let totalAccountBalace = 0;
      //  acctual account balance  update daynamically
      const isDirectorOrSenior =
        requestData.position === "Director" ||
        requestData.position === "Senior Director";

      const isVPOrCHF =
        requestData.position === "VP" || requestData.position === "CHF";

      const isCEO = requestData.position === "CEO";
      // ===============================
      // IFB RULE (matches backend)
      // ===============================
      if (
        (isDirectorOrSenior &&
          requestData.subprocess?.trim() ===
          "Sharia Risk, Investment and Financing") ||
        (isVPOrCHF &&
          requestData.process?.trim() === "Interest Free Banking") ||
        isCEO
      ) {
        try {
          const ifbRes = await axios.post(
            `${baseUrl}/ifb/ifbBalanceDifference`,
            requestData,
          );

          accountBalaceActual = ifbRes.data?.total_difference || 0;
        } catch (err) {
          console.error("IFB Error:", err);
          const message = err?.response?.data?.message || err.message;
          toast.error(`${requestData.user_name}: ${message}`);
        }
      } else {
        // Account Balance Difference
        const accountBalanceRes = await axios.post(
          `${baseUrl}/accountmapping/getBalanceDifference/`,
          requestData,
        );
        accountBalaceActual = accountBalanceRes.data.total_difference;
      }
      totalAccountBalace = accountBalaceActual;

      // for target set bay user iteself
      const totalDepositTarget = userTargetRes.data.total_deposit;
      const totalFcyTarget = userTargetRes.data.total_fcy;
      // totalLoanTarget = userTargetRes.data.total_loan;

      // Dates
      const startDate = new Date("2026-04-01");
      const today = new Date();
      //  Days passed  until current date
      let daysPassed =
        Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      daysPassed = Math.max(0, Math.min(daysPassed, 90));


      // Expected Deposit (by today)
      const expectedDeposit = (daysPassed / 90) * totalDepositTarget;

      //Achievement vs Expected
      const totalCurrentDepositBalace = Number(totalAccountBalace) || 0;
      const expected = Number(expectedDeposit) || 0;
      achievementRate =
        expected > 0 ? (totalCurrentDepositBalace / expected) * 100 : 0;
      setAchievementRateDeposit(achievementRate);

      // for FCY from account mapped  and maual deposit recored 
      const fcyRes = await axios.post(
        `${baseUrl}/fcy/fcyBalanceDifference`,
        requestData
      );
      // for FCY mapped
      const fcyResMapped = await axios.post(
        `${baseUrl}/fcy/fcyBalanceDifferenceByUserMapped`,
        requestData
      );

      // for Loan mapped  for ifb and for branch from  total loan collection 
      let loanRes = 0;
      if (user.process === "Interest Free Banking" || user.process === "Agri and Cooperative Business" || (user.process === "Growth and Operations" && user.organization === "Ho")) {
        loanRes = await axios.post(
          `${baseUrl}/loan/loanBalanceDifferenceMapped`,
          requestData
        );
      }
      else {
        loanRes = await axios.post(
          `${baseUrl}/loan/loanBalanceDifference`,
          requestData
        );
      }

      // for Loan Special Mention
      const specialMentionLoanRes = await axios.post(
        `${baseUrl}/loanaccountmapping/getSpecialMentionLoanSumBalanceByUser`,
        requestData
      );

      // for Loan Outstanding Balance
      const loanOutstandingBalanceRes = await axios.post(
        `${baseUrl}/loanaccountmapping/getLoanOutstandingBalanceByUser`,
        requestData
      );



      // for Fcy
      //  Expected FCY progress (by today)
      let totalfcy =
        // Number(fcyRes.data.total_difference || 0) +
        Number(fcyResMapped.data.total_difference || 0);
      const expectedFcy = (daysPassed / 90) * totalFcyTarget;
      const actualFcy = totalfcy;
      const achievementfcy =
        expectedFcy > 0 ? (actualFcy / expectedFcy) * 100 : 0;
      setAchievementRateFcy(achievementfcy);
      // for Loan
      const actualLoan = loanRes?.data?.total_difference || 0;
      const expectedLoan = (daysPassed / 90) * totalLoanTarget;
      const achievementLoanRate =
        expectedLoan > 0 ? (actualLoan / expectedLoan) * 100 : 0;
      setAchievementRateLoan(achievementLoanRate);


      // for special mention
      const actualSpecialmappingLoan = specialMentionLoanRes?.data?.total_balance || 0;
      const actualOutStandingLoan = loanOutstandingBalanceRes?.data?.total_balance || 0;



      const achievementspecialMentionLoanRate =
        actualOutStandingLoan > 0 ? (actualSpecialmappingLoan / actualOutStandingLoan) * 100 : 0;


      setAchievmentSpecialMentionLoan(achievementspecialMentionLoanRate);


      // User Non Deposit Target feach
      const userNonDepositTargetRes = await axios.post(
        `${baseUrl}/non-deposit-target/summary/`,
        requestData,
      );

      // get atm, eeu, digital target
      const atmEeuDigitalTargetRes = await axios.post(
        `${baseUrl}/non-deposit-target/atm-eeu-digital/`,
        requestData
      );

      setuserNonDepositTarget(userNonDepositTargetRes.data);
      const newAccountTarget = userNonDepositTargetRes.data.total_new_account;
      const unauthorizeTransTarget = userNonDepositTargetRes.data.total_unauthorized;
      const activeCardTarget = userNonDepositTargetRes.data.active_card || 0;
      const eeuTransactionTarget = atmEeuDigitalTargetRes.data.eeu_transaction || 0;

      // for new account
      const newaccountRes = await axios.post(
        `${baseUrl}/nondeposit/new-accounts-summary/`,
        requestData,
      );
      const actualNewAccount = newaccountRes?.data?.total_accounts || 0;
      const expectedNewAccount = (daysPassed / 90) * newAccountTarget;
      const achievementNewAccountRate =
        expectedNewAccount > 0
          ? (actualNewAccount / expectedNewAccount) * 100
          : 0;

      setAchievementRateAccount(achievementNewAccountRate);


      //for unutorized
      const unutorizedTranRes = await axios.post(
        `${baseUrl}/nondeposit/non-txn-summary/`,
        requestData,
      );
      const actualUnutorizedTran =
        unutorizedTranRes?.data?.total_unauthorized || 0;
      const expectedUnutorized = (daysPassed / 90) * unauthorizeTransTarget;
      const achievementUnutorizedRate =
        expectedUnutorized > 0
          ? (actualUnutorizedTran / expectedUnutorized) * 100
          : 0;

      setAchievementRateunauthorizedTran(achievementUnutorizedRate);


      // for active cardd

      const activecardRes = await axios.post(
        `${baseUrl}/nondeposit/activecard/`,
        requestData,
      );

      const actualactiveCard =
        activecardRes?.data?.total_active_card_users || 0;
      const expectedActiveCard = (daysPassed / 90) * activeCardTarget;
      const achievementActiveCard =
        expectedActiveCard > 0
          ? (actualactiveCard / expectedActiveCard) * 100
          : 0;
      setachievementActivecard(achievementActiveCard);

      // for EEU Transactions

      const eeuRes = await axios.post(
        `${baseUrl}/nondeposit/eeutransaction/`,
        requestData,
      );

      const actualeEEU = eeuRes?.data?.total_txn_count || 0;
      const expectedEEU = (daysPassed / 90) * eeuTransactionTarget;
      const achievementEEU =
        expectedEEU > 0 ? (actualeEEU / expectedEEU) * 100 : 0;
      setachievementEeu(achievementEEU);

      // district mapped average
      // mapped districts
      const mappedDistricts = await axios.post(
        `${baseUrl}/districtmapping/getMappedDistrictsByUser/${user.UserName}`
      );

      const districtsObject = {
        districts: mappedDistricts.data.map((item) => item.district_name)
      };

      //get district total target and deposit   
      const districtRes = await axios.post(
        `${baseUrl}/districtmapping/getTargetsAndDepositByDistricts`,
        districtsObject
      );
      const totals = districtRes.data.reduce(
        (sum, item) => ({
          totalDistrictDepositTarget:
            sum.totalDistrictDepositTarget + item.districtDepositTarget,

          totalBalanceDiff:
            sum.totalBalanceDiff + item.balanceDifference,
        }),
        {
          totalDistrictDepositTarget: 0,
          totalBalanceDiff: 0,
        }
      );

      const expecteddistrictDeposit = (daysPassed / 90) * totals.totalDistrictDepositTarget;
      const achievementdistrictDeposit =
        expecteddistrictDeposit > 0
          ? (totals.totalBalanceDiff / expecteddistrictDeposit) * 100
          : 0;

      setachievementdistrictDeposit(achievementdistrictDeposit);
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.status === 404
          ? "No data found for this user"
          : err?.response?.data?.message ||
          err?.response?.data ||
          err.message ||
          "Something went wrong";

      toast.error(message);
    } finally {
    }
  };

  const getAchievementColor = (rate) => {
    if (rate >= 99.9) return "#4CAF50"; // Green
    if (rate >= 99 && rate < 99.9) return "#FFC107"; // Yellow
    return "#F44336"; // Red
  };
  useEffect(() => {
    fetchData();
  }, [user]);


  return (
    <Box sx={{ minHeight: "20vh", p: 3, backgroundColor: "#f9fbffff", fontFamily: "sans-serif" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="700">
          OnePage OKR Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Real-time tracking of objectives, KPIs, and system performance
        </Typography>
      </Box>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

        {/* ROW 1: PRIORITIES AND OKR */}
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ flex: 1 }}>
            <Card elevation={0} sx={{ height: "100%", borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#fef3c7", color: "#d97706", width: 40, height: 40, fontSize: "1.2rem" }}>
                    🕒
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                    Week’s Priorities
                  </Typography>
                </Stack>

                {priorities && priorities.length > 0 ? (
                  <Stack spacing={1.5}>
                    {priorities.map((item, index) => (
                      <Box key={index} sx={{ p: 1.5, borderRadius: 2, borderLeft: "4px solid #f59e0b", backgroundColor: "#fffbeb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#b45309", mb: 0.5 }}>
                          {item.priority_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#78350f", fontWeight: 500, lineHeight: 1.4 }}>
                          {item.detail}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>No Weekly Priorities found. Please work with your line manager to define your priorities for the week.</Typography>
                )}
              </CardContent>
            </Card>
          </div>

          <div style={{ flex: 1 }}>
            <Card elevation={0} sx={{ height: "100%", borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#eff6ff", color: "#3b82f6", width: 40, height: 40, fontSize: "1.2rem" }}>
                    🎯
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                    Quarter OKR
                  </Typography>
                </Stack>

                {objectives.length > 0 ? (
                  <Stack spacing={2}>
                    {objectives.map((obj) => {
                      const relatedKrs = krs.filter((kr) => kr.objective_id === obj.objective_id);
                      return (
                        <Box key={obj.objective_id}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1, lineHeight: 1.3 }}>
                            {obj.objective_detail}
                          </Typography>
                          {relatedKrs.length > 0 ? (
                            <Stack spacing={1}>
                              {relatedKrs.map((kr, index) => (
                                <Paper elevation={0} key={kr.kr_id} sx={{ p: 1.2, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                  <Chip label={`KR ${index + 1}`} size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 800, borderRadius: 1, height: 20, fontSize: "0.7rem" }} />
                                  <Typography variant="body2" sx={{ color: "#334155", pt: 0.2, fontWeight: 500, fontSize: "0.85rem" }}>
                                    {kr.kr_detail}
                                  </Typography>
                                </Paper>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" sx={{ fontStyle: "italic", color: "#94a3b8", fontSize: "0.85rem" }}>No Key Results defined for this objective.</Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>No Quarter OKRs found. Please define your objectives for this quarter.</Typography>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROW 2: KPI */}
        <div style={{ width: "100%" }}>
          {user.organization === "Branch" || (user.process === "Growth and Operations" && (((user.position === "Director" || user.position === "Senior Director") && user.organization === "Do") || user.position === "VP" || user.position === "CHF")) ? (
            <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
                  Health Metrics / KPI
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>S/N</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Metric</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "right", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sn: "H1", name: "Target Achievement Rate - Deposit", icon: "💰", value: achievementRateDeposit },
                        { sn: "H2", name: "Target Achievement Rate - FCY", icon: "📊", value: achievementRateFcy },
                        { sn: "H3", name: "Loan Collection Performance Against the Plan", icon: "⚖️", value: achievementRateLoan },
                        { sn: "H4", name: "New Account Against the Plan", icon: "📈", value: achievementRateAccount },
                        { sn: "H5", name: "Unauthorized Transaction Against the Plan", icon: "📉", value: achievementRateunauthorizedTran },
                        { sn: "H7", name: "Active Card Against the Plan", icon: "💳", value: achievementActivecard },
                        { sn: "H8", name: "EEU Against the Plan", icon: "💳", value: achievementEeu },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ backgroundColor: "#f8fafc", transition: "background-color 0.2s", "&:hover": { backgroundColor: "#f1f5f9" } }}>
                          <td style={{ padding: "10px 12px", borderRadius: "8px 0 0 8px", color: "#64748b", fontWeight: 600, fontSize: "0.85rem" }}>{row.sn}</td>
                          <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: 700, fontSize: "0.85rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <span style={{ fontSize: "1.1rem" }}>{row.icon}</span>
                              {row.name}
                            </Box>
                          </td>
                          <td style={{ padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(Number(row.value), 100)}
                                sx={{ flex: 1, minWidth: "100px", maxWidth: "200px", height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", "& .MuiLinearProgress-bar": { backgroundColor: getAchievementColor(Number(row.value).toFixed(2)), borderRadius: 4 } }}
                              />
                              <Chip
                                size="small"
                                label={`${Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                                sx={{ backgroundColor: getAchievementColor(Number(row.value).toFixed(2)), color: "#fff", fontWeight: 800, borderRadius: 1.5, minWidth: "60px", fontSize: "0.75rem" }}
                              />
                            </Box>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          ) : user.process === "Interest Free Banking" ? (
            <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
                  Health Metrics / KPI
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>S/N</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Metric</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "right", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sn: "H1", name: "Deposit Target Achievment Rate - from Mapped Customers", icon: "💰", value: achievementRateDeposit },
                        { sn: "H2", name: "Deposit Target Achievment Rate of Assigned District", icon: "🏢", value: achievementdistrictDeposit },
                        { sn: "H3", name: "Target Achievment Rate -FCY", icon: "📊", value: achievementRateFcy },
                        { sn: "H4", name: "Collection Performance Against the Week's Plan", icon: "⚖️", value: achievementRateLoan },
                        { sn: "H5", name: "Special Mention Ratio(Portfolio)", icon: "📉", value: achievmentSpecialMentionLoan },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ backgroundColor: "#f8fafc", transition: "background-color 0.2s", "&:hover": { backgroundColor: "#f1f5f9" } }}>
                          <td style={{ padding: "10px 12px", borderRadius: "8px 0 0 8px", color: "#64748b", fontWeight: 600, fontSize: "0.85rem" }}>{row.sn}</td>
                          <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: 700, fontSize: "0.85rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <span style={{ fontSize: "1.1rem" }}>{row.icon}</span>
                              {row.name}
                            </Box>
                          </td>
                          <td style={{ padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(Number(row.value), 100)}
                                sx={{ flex: 1, minWidth: "100px", maxWidth: "200px", height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", "& .MuiLinearProgress-bar": { backgroundColor: getAchievementColor(Number(row.value).toFixed(2)), borderRadius: 4 } }}
                              />
                              <Chip
                                size="small"
                                label={`${Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                                sx={{ backgroundColor: getAchievementColor(Number(row.value).toFixed(2)), color: "#fff", fontWeight: 800, borderRadius: 1.5, minWidth: "60px", fontSize: "0.75rem" }}
                              />
                            </Box>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          ) : (user.process === "Agri and Cooperative Business" || (user.process === "Growth and Operations" && user.organization === "Ho")) ? (
            <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
                  Health Metrics / KPI
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>S/N</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Metric</th>
                        <th style={{ padding: "8px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "right", color: "#64748b", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sn: "H1", name: "Target Achievement Rate - Deposit", icon: "💰", value: achievementRateDeposit },
                        { sn: "H2", name: "Target Achievement Rate - FCY", icon: "📊", value: achievementRateFcy },
                        { sn: "H3", name: "Loan Collection Performance Against the Plan", icon: "⚖️", value: achievementRateLoan },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ backgroundColor: "#f8fafc", transition: "background-color 0.2s", "&:hover": { backgroundColor: "#f1f5f9" } }}>
                          <td style={{ padding: "10px 12px", borderRadius: "8px 0 0 8px", color: "#64748b", fontWeight: 600, fontSize: "0.85rem" }}>{row.sn}</td>
                          <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: 700, fontSize: "0.85rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <span style={{ fontSize: "1.1rem" }}>{row.icon}</span>
                              {row.name}
                            </Box>
                          </td>
                          <td style={{ padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(Number(row.value), 100)}
                                sx={{ flex: 1, minWidth: "100px", maxWidth: "200px", height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", "& .MuiLinearProgress-bar": { backgroundColor: getAchievementColor(Number(row.value).toFixed(2)), borderRadius: 4 } }}
                              />
                              <Chip
                                size="small"
                                label={`${Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                                sx={{ backgroundColor: getAchievementColor(Number(row.value).toFixed(2)), color: "#fff", fontWeight: 800, borderRadius: 1.5, minWidth: "60px", fontSize: "0.75rem" }}
                              />
                            </Box>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", textAlign: "center", p: 4 }}>
              <Typography variant="subtitle1" sx={{ color: "#64748b", fontWeight: 700 }}>No Health Metrics assigned to your role.</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>Contact your system administrator if this is a mistake.</Typography>
            </Card>
          )}
        </div>

        {/* ROW 3: BAU AND OKR MONITORING */}
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ flex: 1 }}>
            <Card elevation={0} sx={{ height: "100%", borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#dcfce7", color: "#16a34a", width: 40, height: 40, fontSize: "1.2rem" }}>
                    📋
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                    Business As Usual (BAU)
                  </Typography>
                </Stack>
                {bauData.length > 0 ? (
                  <Stack spacing={2}>
                    {bauData.map((bau) => (
                      <Paper elevation={0} key={bau.id} sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 1.5, backgroundColor: "#f8fafc" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>{bau.business_usual}</Typography>
                        <Stack spacing={1}>
                          {[1, 2, 3, 4, 5].map(num => bau[`resp${num}`] && (
                            <Box key={num} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                              <Chip label={`R${num}`} size="small" sx={{ bgcolor: "#e2e8f0", color: "#475569", fontWeight: 800, borderRadius: 1, height: 20, fontSize: "0.7rem", minWidth: "35px" }} />
                              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, fontSize: "0.85rem", pt: 0.1 }}>{bau[`resp${num}`]}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>No Core Operations/BAU tasks assigned. Please coordinate with your department lead.</Typography>
                )}
              </CardContent>
            </Card>
          </div>

          <div style={{ flex: 1 }}>
            <Card elevation={0} sx={{ height: "100%", borderRadius: 2, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", transition: "box-shadow 0.3s", "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#f3e8ff", color: "#9333ea", width: 40, height: 40, fontSize: "1.2rem" }}>
                    🔭
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                    Quarter OKR Monitoring
                  </Typography>
                </Stack>
                {quarterOkrData.length > 0 ? (
                  <Stack spacing={2}>
                    {quarterOkrData.map((q) => (
                      <Box key={q.id} sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 1.5, backgroundColor: "#f8fafc" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>{q.kr}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          {[1, 2, 3, 4, 5].map(num => q[`month${num}`] && (
                            <Chip
                              key={num}
                              size="small"
                              label={`M${num}: ${isNaN(q[`month${num}`]) ? q[`month${num}`] : Number(q[`month${num}`]).toLocaleString()}`}
                              sx={{ backgroundColor: "#ffffff", color: "#334155", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: 1, fontSize: "0.75rem", height: 24 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>No OKR monitoring data available. Ensure your OKR progress is being tracked.</Typography>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </Box>
  );
};

export default Dashboard;
