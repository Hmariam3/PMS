import React, { useState, useContext, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  useTheme,
  Avatar,
  LinearProgress,
  Stack,
  Divider,
  Paper,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  PriorityHigh as PriorityIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import { toast } from "react-toastify";

const DashboardTeam = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [dashboardData, setDashboardData] = useState({});
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  //   Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await axios.post(`${baseUrl}/users/getUserByPostion/`,
        {

          user_id: user.UserName,
          position: user.position,
          supervisor: user.MailAdress || null,
          process: user.process || null,
          subprocess: user.subprocess || null,
          team: user.team || null,
          cbsusername: user.cbsusername || null,
        });
      // console.log("res", res.data);
      let filteredUsers = Array.isArray(res.data) ? res.data : [];
      if (user.position === "Individual") {
        filteredUsers = filteredUsers.filter((u) => u.user_name === user.UserName);
      }

      // Sort users by position
      const positionOrder = {
        "CEO": 1,
        "CHF": 2,
        "VP": 3,
        "Senior Director": 4,
        "Director": 5,
        "Manager": 6,
        "CRM": 7,
        "Individual": 8,
      };

      filteredUsers.sort((a, b) => {
        const orderA = positionOrder[a.position] || 99;
        const orderB = positionOrder[b.position] || 99;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.full_name || "").localeCompare(b.full_name || "");
      });


      setUsers(filteredUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async (singleUser) => {
    const requestData = {
      user_id: singleUser.user_name,
      user_name: singleUser.user_name,
      position: singleUser.position,
      process: singleUser.process || null,
      subprocess: singleUser.subprocess || null,
      team: singleUser.team || null,
      cbsusername: singleUser.cbsusername || null,
    };
    // console.log("requestData", requestData);
    try {
      const priorRes = await axios.post(
        `${baseUrl}/priorities/getPriorityByUser`,
        requestData
      );

      // tearget set
      // for finatial product
      const targetRes = await axios.post(
        `${baseUrl}/targets/TargetsSummary`,
        requestData
      );
      const LoantargetRes = await axios.post(
        `${baseUrl}/targets/loanCollectionTargetByUser/`,
        requestData
      );
      // console.log("loantarget", LoantargetRes.data);
      let totalLoanTarget = 0;
      if (singleUser.process === "Interest Free Banking" || singleUser.process === "Agri and Cooperative Business" || (singleUser.process === "Growth and Operations" && singleUser.organization === "Ho")) {
        //for crm and Ho
        totalLoanTarget = Number(targetRes.data.total_loan) || 0;
      } else {
        //for branch users 
        totalLoanTarget = Number(LoantargetRes.data.loan_collection) || 0;
      }

      // for Loan Special Mention
      const specialMentionLoanRes = await axios.post(
        `${baseUrl}/loanaccountmapping/getSpecialMentionLoanSumBalanceByUser`,
        requestData
      );

      const loanOutstandingBalanceRes = await axios.post(
        `${baseUrl}/loanaccountmapping/getLoanOutstandingBalanceByUser`,
        requestData
      );

      // for special mention
      const actualSpecialmappingLoan = specialMentionLoanRes?.data?.total_balance || 0;
      const actualOutStandingLoan = loanOutstandingBalanceRes?.data?.total_balance || 0;

      const achievementspecialMentionLoanRate =
        actualOutStandingLoan > 0 ? (actualSpecialmappingLoan / actualOutStandingLoan) * 100 : 0;


      // for non financial product
      const userNonDepositTargetRes = await axios.post(
        `${baseUrl}/non-deposit-target/summary/`,
        requestData
      );

      // get atm, eeu, digital target
      const atmEeuDigitalTargetRes = await axios.post(
        `${baseUrl}/non-deposit-target/atm-eeu-digital/`,
        requestData
      );

      // actual balance  from system and maapped and fcy and loan 
      // for financial product
      let ifbBalance = 0;
      let accountBalance = 0;
      const isDirectorOrSenior = singleUser.position === "Director" || singleUser.position === "Senior Director";
      const isVPOrCHF = singleUser.position === "VP" || singleUser.position === "CHF";
      const isCEO = singleUser.position === "CEO";

      if ((isDirectorOrSenior && singleUser.subprocess?.trim() === "Sharia Risk, Investment and Financing") || (isVPOrCHF && singleUser.process?.trim() === "Interest Free Banking") || isCEO) {
        try {
          const ifbRes = await axios.post(`${baseUrl}/ifb/ifbBalanceDifference`, requestData);
          ifbBalance = ifbRes.data?.total_difference || 0;
          accountBalance = ifbBalance;

        } catch (err) {
          console.error("IFB Error:", err);
        }
      }
      else {
        const accountRes = await axios.post(
          `${baseUrl}/accountmapping/getBalanceDifference`,
          requestData
        );
        accountBalance = accountRes.data.total_difference || 0;
      }

      const fcyRes = await axios.post(
        `${baseUrl}/fcy/fcyBalanceDifference`,
        requestData
      );
      let fcyResMapped = await axios.post(
        `${baseUrl}/fcy/fcyBalanceDifferenceByUserMapped`,
        requestData
      );

      let loanRes = 0;
      if (singleUser.process === "Interest Free Banking" || singleUser.process === "Agri and Cooperative Business" || (singleUser.process === "Growth and Operations" && singleUser.organization === "Ho")) {
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

      // console.log("loanRes", loanRes);


      // for non financial product
      const newaccountRes = await axios.post(
        `${baseUrl}/nondeposit/new-accounts-summary/`,
        requestData
      );
      const unutorizedTranRes = await axios.post(
        `${baseUrl}/nondeposit/non-txn-summary/`,
        requestData
      );
      const activecardRes = await axios.post(
        `${baseUrl}/nondeposit/activecard/`,
        requestData
      );

      const eeuRes = await axios.post(
        `${baseUrl}/nondeposit/eeutransaction/`,
        requestData
      );

      const newAccountOnboardingRes = await axios.post(
        `${baseUrl}/nondeposit/getNewCustomerOnboardingSummaryByUser/`,
        requestData
      );


      const customerEngagementRes = await axios.post(
        `${baseUrl}/nondeposit/getCustomerEngagementSummaryByUser/`,
        requestData
      );



      // calculated for finatial and non finatial product target and balance
      // get targets  and set
      const totalDeposit = targetRes.data.total_deposit || 0;
      const totalFcyTarget = targetRes.data.total_fcy || 0;

      // totalLoanTarget = totalLoanTarget || 0;



      const totalBalance = accountBalance;
      const startDate = new Date("2026-04-01");
      const today = new Date();
      let daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      daysPassed = Math.max(0, Math.min(daysPassed, 90));
      // calculate daily  expected 
      const expectedDeposit = (daysPassed / 90) * totalDeposit;
      const expectedFcy = (daysPassed / 90) * totalFcyTarget;
      const expectedLoan = (daysPassed / 90) * totalLoanTarget;


      let totalfcy =
        // Number(fcyRes.data.total_difference || 0) +
        Number(fcyResMapped.data.total_difference || 0);

      // calculate current achivement rate
      const achievementDeposit = expectedDeposit > 0 ? (totalBalance / expectedDeposit) * 100 : 0;
      const achievementFcy = expectedFcy > 0 ? ((totalfcy || 0) / expectedFcy) * 100 : 0;
      const achievementLoan = expectedLoan > 0 ? ((loanRes.data.total_difference || 0) / expectedLoan) * 100 : 0;

      // get non financial targets


      const newAccountTarget = userNonDepositTargetRes.data.total_new_account || 0;
      const unauthorizeTransTarget = userNonDepositTargetRes.data.total_unauthorized || 0;
      const activeCardTarget = userNonDepositTargetRes.data.active_card || 0;
      const eeuTransactionTarget = atmEeuDigitalTargetRes.data.eeu_transaction || 0;
      const customer_engagementTarget = userNonDepositTargetRes.data.customer_engagement || 0;
      const new_customer_onboardingTarget = userNonDepositTargetRes.data.new_customer_onboarding || 0;


      // get actual non financial product
      const actualNewAccount = newaccountRes?.data?.total_accounts || 0;
      let actualUnutorizedTran = unutorizedTranRes?.data?.total_unauthorized || 0;
      const actualactiveCard = activecardRes?.data?.total_active_card_users || 0;
      const actualeEEU = eeuRes?.data?.total_txn_count || 0;
      const actualcustomerEngagement = customerEngagementRes?.data?.total_customer_engagement || 0;
      const actualNewCustomerOnboarding = newAccountOnboardingRes?.data?.total_new_customer_onboarding || 0;

      // calculate daily expected for non financial product
      const expectedNewAccount = (daysPassed / 90) * newAccountTarget;
      const expectedUnutorized = (daysPassed / 90) * unauthorizeTransTarget;
      const expectedActiveCard = (daysPassed / 90) * activeCardTarget;
      const expectedEEU = (daysPassed / 90) * eeuTransactionTarget;
      const expectedCustomerEngagement = (daysPassed / 90) * customer_engagementTarget;
      const expectedNewCustomerOnboarding = (daysPassed / 90) * new_customer_onboardingTarget;



      // calculate current achivement rate for non financial product
      const achievementNewAccount = expectedNewAccount > 0 ? (actualNewAccount / expectedNewAccount) * 100 : 0;

      // if (actualUnutorizedTran === 0) {
      //   actualUnutorizedTran = 100;
      // } else {
      //   actualUnutorizedTran = 0;
      // }
      const achievementUnauthorized = expectedUnutorized > 0 ? (actualUnutorizedTran / expectedUnutorized) * 100 : 0;
      const achievementActiveCard = expectedActiveCard > 0 ? (actualactiveCard / expectedActiveCard) * 100 : 0;
      const achievementEEU = expectedEEU > 0 ? (actualeEEU / expectedEEU) * 100 : 0;
      const achievementCustomerEngagement = expectedCustomerEngagement > 0 ? (actualcustomerEngagement / expectedCustomerEngagement) * 100 : 0;
      const achievementNewCustomerOnboarding = expectedNewCustomerOnboarding > 0 ? (actualNewCustomerOnboarding / expectedNewCustomerOnboarding) * 100 : 0;

      // for ifb departement crm 
      // mapped districts
      const mappedDistricts = await axios.post(
        `${baseUrl}/districtmapping/getMappedDistrictsByUser/${singleUser.user_name}`
      );
      const districtsObject = {
        districts: mappedDistricts.data.map((item) => item.district_name)
      };

      //get district total target and deposit   
      const districtRes = await axios.post(
        `${baseUrl}/districtmapping/getTargetsAndDepositByDistricts`,
        districtsObject
      );
      const districtAchievement = districtRes.data.map((item) => {
        const districtDepositTarget = Number(item.total_deposit_target);
        const balanceDiff = Number(item.balance_difference);

        const expecteddistrictDeposit = (daysPassed / 90) * districtDepositTarget;

        const achievementdistrictDeposit =
          expecteddistrictDeposit > 0
            ? (balanceDiff / expecteddistrictDeposit) * 100
            : 0;

        return {
          district: item.district_name,
          achievementdistrictDeposit,
          balanceDifference: balanceDiff,
        };
      });

      setDashboardData((prev) => ({
        ...prev,
        [singleUser.user_name]: {
          priorities: priorRes.data,
          achievementDeposit,
          achievementFcy,
          achievementLoan,
          achievementNewAccount,
          achievementUnauthorized,
          achievementActiveCard,
          achievementEEU,
          districtAchievement,
          achievementCustomerEngagement,
          achievementNewCustomerOnboarding,
          achievementspecialMentionLoanRate,
        },
      }));
    } catch (err) {
      console.log("Full Error:", err);

      const message =
        err.response?.data?.message ||   // backend message
        err.response?.data?.error ||     // fallback error
        err.message ||                   // axios error
        "Something went wrong";

      toast.error(message);
    }
  };

  const getColor = (value) => {
    if (value >= 100) return "#10b981"; // Emerald
    if (value >= 80) return "#f59e0b"; // Amber
    return "#ef4444"; // Rose
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      users.forEach((u) => fetchData(u));
    }
  }, [users]);

  const teamSummary = useMemo(() => {
    const dataValues = Object.values(dashboardData);
    if (dataValues.length === 0) return null;

    const avg = (key) => dataValues.reduce((acc, curr) => acc + (curr[key] || 0), 0) / dataValues.length;

    return {
      avgDeposit: avg("achievementDeposit"),
      avgFcy: avg("achievementFcy"),
      avgLoan: avg("achievementLoan"),
      totalPriorities: dataValues.reduce((acc, curr) => acc + (curr.priorities?.length || 0), 0),
    };
  }, [dashboardData]);

  return (
    <Box sx={{ minHeight: "20vh", p: 3, backgroundColor: "#f9fbffff", fontFamily: "sans-serif" }}>
      {/* HEADER SECTION */}
      {/* sx={{ fontWeight: 800, color: "#1e293b", mb: 1, fontFamily: "sans-serif" }} */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="700" >
          Team Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time tracking of KPIs, and system performance
        </Typography>
      </Box>

      {/* SUMMARY CARDS */}
      {/* {teamSummary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: "Total Team Members", value: users.length, icon: <GroupIcon />, color: "#3b82f6" },
            { label: "Avg. Deposit Achievement", value: `${teamSummary.avgDeposit.toFixed(1)}%`, icon: <TrendingUpIcon />, color: "#10b981" },
            { label: "Avg. FCY Achievement", value: `${teamSummary.avgFcy.toFixed(1)}%`, icon: <TrendingUpIcon />, color: "#f59e0b" },
            { label: "Team Active Priorities", value: teamSummary.totalPriorities, icon: <PriorityIcon />, color: "#8b5cf6" },
          ].map((stat, i) => (
            <Grid item xs={StatCardGridWidth(i)} md={3} key={i}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>{stat.icon}</Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>{stat.value}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )} */}

      {/* INDIVIDUAL CARDS */}
      <Grid container spacing={3}>

        {users
          .map((u) => {
            const data = dashboardData[u.user_name];
            if (!data) return null;
            const getOrgLabel = (u) => {
              if (["CRM", "Individual", "Manager"].includes(u.position)) {
                return u.team;
              }

              if (["Director", "Senior Director"].includes(u.position)) {
                return u.subprocess;
              }

              if (["VP", "CHF"].includes(u.position)) {
                return u.process;
              }

              return u.team; // fallback
            };
            return (
              <Grid item xs={12} key={u.user_name}>
                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", height: "100%", transition: "0.3s", "&:hover": { boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" } }}>
                  <CardContent sx={{ p: 4 }}>
                    {/* User Header */}
                    <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 4 }}>
                      <Avatar sx={{ width: 80, height: 80, bgcolor: "#f1f5f9", color: "#1e293b", fontWeight: 600, fontSize: "1.5rem" }}>
                        {u.full_name?.split(" ").map(n => n[0]).join("")}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1e293b" }}>{u.full_name}</Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                          <Chip label={u.position} size="medium" color="primary" variant="filled" sx={{ fontWeight: 700, borderRadius: 2 }} />
                          <Chip label={getOrgLabel(u)} size="medium" variant="outlined" sx={{ fontWeight: 600, borderRadius: 2 }} />
                        </Stack>
                      </Box>
                    </Stack>

                    <Divider sx={{ mb: 4 }} />

                    {/* KPI Section */}
                    <Typography variant="h6" sx={{ fontWeight: 550, mb: 3, color: "#1e293b", textTransform: "uppercase" }}>Key Performance Indicators</Typography>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        mb: 6,
                        overflowX: "auto",
                        pb: 2,
                        "&::-webkit-scrollbar": { height: 6 },
                        "&::-webkit-scrollbar-thumb": { bgcolor: "#cbd5e1", borderRadius: 3 }
                      }}
                    >
                      {[
                        ...(user.organization === "Branch" || user.process === "Interest Free Banking" || user.process === "Growth and Operations" || user.process === "Agri and Cooperative Business" || (user.position === "CRM" && user.organization === "Ho")
                          ? [{ label: "Deposit", val: data.achievementDeposit }]
                          : []),

                        ...(user.organization === "Branch" || user.process === "Interest Free Banking" || user.process === "Growth and Operations" || user.process === "Agri and Cooperative Business" || (user.position === "CRM" && user.organization === "Ho")
                          ? [{ label: "FCY Generation", val: data.achievementFcy }]
                          : []),

                        ...(user.organization === "Branch" || user.process === "Interest Free Banking" || user.process === "Growth and Operations" || user.process === "Agri and Cooperative Business" || (user.position === "CRM" && user.organization === "Ho")
                          ? [{ label: "Loan Collection", val: data.achievementLoan }]
                          : []),

                        ...(user.organization === "Branch" || (user.process === "Growth and Operations" && (((user.position === "Director" || user.position === "Senior Director") && user.organization === "Do") || user.position === "VP" || user.position === "CHF"))
                          ? [
                            {
                              label: "New Account",
                              val: data.achievementNewAccount,
                            },
                          ]
                          : []),

                        ...(user.organization === "Branch" || (user.process === "Growth and Operations" && (((user.position === "Director" || user.position === "Senior Director") && user.organization === "Do") || user.position === "VP" || user.position === "CHF"))
                          ? [
                            {
                              label: "Unauthorized TXN",
                              val: data.achievementUnauthorized,
                            },
                          ]
                          : []),

                        ...(user.organization === "Branch" || (user.process === "Growth and Operations" && (((user.position === "Director" || user.position === "Senior Director") && user.organization === "Do") || user.position === "VP" || user.position === "CHF"))
                          ? [
                            {
                              label: "Active Card",
                              val: data.achievementActiveCard,
                            },
                          ]
                          : []),

                        ...(user.organization === "Branch" || (user.process === "Growth and Operations" && (((user.position === "Director" || user.position === "Senior Director") && user.organization === "Do") || user.position === "VP" || user.position === "CHF"))
                          ? [
                            {
                              label: "EEU Account",
                              val: data.achievementEEU,
                            },
                          ]
                          : []),

                        ...(user.process === "Interest Free Banking"
                          ? [
                            {
                              label: "Customer Engagement",
                              val: data.achievementCustomerEngagement,
                            },
                          ]
                          : []),

                        ...(user.process === "Interest Free Banking"
                          ? [
                            {
                              label: "New Customer Onboarding",
                              val: data.achievementNewCustomerOnboarding,
                            },
                          ]
                          : []),

                        ...(user.process === "Interest Free Banking"
                          ? [
                            {
                              label: "Special Mention Loan Rate",
                              val: data.achievementspecialMentionLoanRate,
                            },
                          ]
                          : []),
                        ...(user.process === "Interest Free Banking"
                          ? (data.districtAchievement || []).map((item) => ({
                            label: item.district,
                            val: item.achievementdistrictDeposit,
                          }))
                          : []),
                      ].map((kpi, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            flex: "0 0 auto",
                            width: "auto",
                            minWidth: "110px",
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            transition: "0.2s",
                            "&:hover": { bgcolor: "#eef2f6", transform: "translateY(-2px)" }
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: "#475569",
                              mb: 0.5,
                              textTransform: "uppercase",
                              display: "block",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {kpi.label}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 900,
                              color: getColor(kpi.val),
                              mb: 1,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {kpi.val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(kpi.val, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "#cbd5e1",
                              "& .MuiLinearProgress-bar": { bgcolor: getColor(kpi.val), borderRadius: 3 }
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>


                    {(
                      user.organization === "Ho" ||
                      user.position === "Director" ||
                      user.position === "Senior Director"
                    ) && (
                        <>
                          {/* Priorities Section */}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 550,
                              mb: 4,
                              color: "#1e293b",
                              textTransform: "uppercase",
                            }}
                          >
                            Weekly Priorities
                          </Typography>

                          <Grid container spacing={3}>
                            {data.priorities.length > 0 ? (
                              data.priorities.map((p, i) => (
                                <Grid item xs={12} sm={6} md={4} key={i}>
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      p: 3,
                                      bgcolor: "#f8fafc",
                                      borderRadius: 4,
                                      border: "1px solid #e2e8f0",
                                      height: "100%",
                                      transition: "0.2s",
                                      "&:hover": {
                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                      },
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        fontWeight: 500,
                                        color: "#1b3fcd",
                                        mb: 2,
                                        borderLeft: "5px solid #1b3fcd",
                                        pl: 2,
                                      }}
                                    >
                                      {p.priority_name}
                                    </Typography>

                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: "#334155",
                                        lineHeight: 1.8,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {p.detail}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              ))
                            ) : (
                              <Grid item xs={12}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 6,
                                    textAlign: "center",
                                    bgcolor: "#f8fafc",
                                    borderRadius: 4,
                                    border: "1px dashed #cbd5e1",
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    color="textSecondary"
                                    fontStyle="italic"
                                  >
                                    No active priorities listed for this week
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>
                        </>
                      )}

                  </CardContent>
                </Card>
              </Grid>
            );
          })}
      </Grid>
    </Box>
  );
};

const StatCardGridWidth = (i) => (i === 0 || i === 1 ? 12 : 6); // Simple helper for responsive widths on small screens

export default DashboardTeam;
