import React, { useState, useContext, useEffect } from "react";
import { Box, Typography, useTheme, useMediaQuery, Divider, Stack } from "@mui/material";
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
      const totalLoanTarget = userTargetRes.data.total_loan;

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
      if (user.process === "Interest Free Banking") {
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
        Number(fcyRes.data.total_difference || 0) +
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
      setuserNonDepositTarget(userNonDepositTargetRes.data);
      const newAccountTarget = userNonDepositTargetRes.data.total_new_account;
      const unauthorizeTransTarget =
        userNonDepositTargetRes.data.total_unauthorized;
      const activeCardTarget = userNonDepositTargetRes.data.active_card || 0;
      const eeuTransactionTarget =
        userNonDepositTargetRes.data.eeu_transaction || 0;

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
    <Box
      sx={{ minHeight: "20vh" }}
    >
      <div style={{ display: "flex", gap: "10px" }}>
        {/* LEFT DIV */}
        <div
          style={{
            width: "50%",
            backgroundColor: "#e8d4c3", // light beige
            padding: "15px",
            border: "2px solid black",
          }}
        >
          <h4>Week’s Priorities – EA Awareness & Module Finalization</h4>

          {priorities && priorities.length > 0 ? (
            priorities.map((item, index) => (
              <p key={index}>
                <strong>{item.priority_name}</strong> : {item.detail}
              </p>
            ))
          ) : (
            <p>No priorities available</p>
          )}
        </div>

        {/* RIGHT DIV */}
        <div
          style={{
            width: "50%",
            backgroundColor: "#e39a74", // orange
            padding: "15px",
            border: "2px solid black",
          }}
        >
          <h4>
            Quarter OKR (Strengthen the Core / Fix Crux / Build the Future)
          </h4>          {objectives.length > 0 ? (
            objectives.map((obj) => {
              const relatedKrs = krs.filter(
                (kr) => kr.objective_id === obj.objective_id,
              );
              return (
                <div key={obj.objective_id} style={{ marginBottom: "15px" }}>
                  <h5 style={{ fontWeight: "bold", margin: "5px 0" }}>
                    Objective: {obj.objective_detail}
                  </h5>
                  {relatedKrs.length > 0 ? (
                    relatedKrs.map((kr, index) => (
                      <p key={kr.kr_id} style={{ margin: "2px 0", fontSize: "0.9rem" }}>
                        <strong>KR{index + 1}</strong>: {kr.kr_detail}
                      </p>
                    ))
                  ) : (
                    <p style={{ fontSize: "0.85rem", fontStyle: "italic" }}>No KR available</p>
                  )}
                </div>
              );
            })
          ) : (
            <p>No objectives available</p>
          )}
        </div>
      </div>



      <div style={{ display: "flex", marginTop: "10px" }}>
        {/* LEFT - PROJECT TABLE */}
        <div
          style={{
            width: "65%",
            backgroundColor: "#c7dce5",
            border: "2px solid black",
            padding: "10px",
          }}
        >
          <h4>Upcoming Major Projects</h4>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#d9c2b0" }}>
                <th style={{ border: "1px solid black" }}>Project</th>
                <th style={{ border: "1px solid black" }}>W1</th>
                <th style={{ border: "1px solid black" }}>W2</th>
                <th style={{ border: "1px solid black" }}>W3</th>
                <th style={{ border: "1px solid black" }}>W4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid black" }}>Project X</td>
                <td style={{ border: "1px solid black" }}>Finalize UAT</td>
                <td style={{ border: "1px solid black" }}>Deploy</td>
                <td style={{ border: "1px solid black" }}>Integrate</td>
                <td style={{ border: "1px solid black" }}>Complete</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT - KPI */}
        {/* {console.log("user", user)} */}
        {user.organization === "Branch" ? (
          <div
            style={{
              width: "35%",
              backgroundColor: "#c7dce5",
              border: "2px solid black",
              padding: "10px",
            }}
          >
            <h4>Health Metrics / KPI</h4>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid black" }}>S/N</th>
                  <th style={{ border: "1px solid black" }}>Metric</th>
                  <th
                    style={{
                      border: "1px solid black",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid black" }}>H1</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>Target Achievement Rate - Deposit</strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementRateDeposit.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementRateDeposit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>

                <tr>
                  <td style={{ border: "1px solid black" }}>H2</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>Target Achievement Rate - FCY</strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementRateFcy.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementRateFcy).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>

                <tr>
                  <td style={{ border: "1px solid black" }}>H3</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>
                      Loan Collection Performance against the plan
                    </strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementRateLoan.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementRateLoan).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>

                <tr>
                  <td style={{ border: "1px solid black" }}>H4</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>New Account against the plan </strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementRateAccount.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementRateAccount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>

                <tr>
                  <td style={{ border: "1px solid black" }}>H5</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>
                      Unauthorized transaction against the plan{" "}
                    </strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementRateunauthorizedTran.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementRateunauthorizedTran).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>

                <tr>
                  <td style={{ border: "1px solid black" }}>H7</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>Active Card against the plan </strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementActivecard.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementActivecard).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>

                <tr>
                  <td style={{ border: "1px solid black" }}>H8</td>
                  <td style={{ border: "1px solid black" }}>
                    <strong>EEU against the plan </strong>{" "}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      backgroundColor: getAchievementColor(
                        achievementEeu.toFixed(2),
                      ),
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {Number(achievementEeu).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) :
          user.process === "Interest Free Banking" ?
            (
              <div
                style={{
                  width: "35%",
                  backgroundColor: "#c7dce5",
                  border: "2px solid black",
                  padding: "10px",
                }}
              >
                <h4>Health Metrics / KPI</h4>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid black" }}>S/N</th>
                      <th style={{ border: "1px solid black" }}>Metric</th>
                      <th
                        style={{
                          border: "1px solid black",
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid black" }}>H1</td>
                      <td style={{ border: "1px solid black" }}>
                        <strong>Deposit Target Achievment Rate - from Mapped Customers</strong>{" "}
                      </td>
                      <td
                        style={{
                          border: "1px solid black",
                          backgroundColor: getAchievementColor(
                            achievementRateDeposit.toFixed(2),
                          ),
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {Number(achievementRateDeposit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </td>
                    </tr>

                    <tr>
                      <td style={{ border: "1px solid black" }}>H2</td>
                      <td style={{ border: "1px solid black" }}>
                        <strong>Deposit Target Achievment Rate of Assigned District</strong>{" "}
                      </td>
                      <td
                        style={{
                          border: "1px solid black",
                          backgroundColor: getAchievementColor(
                            achievementdistrictDeposit.toFixed(2),
                          ),
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {Number(achievementdistrictDeposit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </td>
                    </tr>

                    <tr>
                      <td style={{ border: "1px solid black" }}>H3</td>
                      <td style={{ border: "1px solid black" }}>
                        <strong>
                          Target Achievment Rate -FCY
                        </strong>{" "}
                      </td>
                      <td
                        style={{
                          border: "1px solid black",
                          backgroundColor: getAchievementColor(
                            achievementRateFcy.toFixed(2),
                          ),
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {Number(achievementRateFcy).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </td>

                    </tr>

                    <tr>
                      <td style={{ border: "1px solid black" }}>H4</td>
                      <td style={{ border: "1px solid black" }}>
                        <strong>Collection Performance against the Weeks's Plan</strong>{" "}
                      </td>
                      <td
                        style={{
                          border: "1px solid black",
                          backgroundColor: getAchievementColor(
                            achievementRateLoan.toFixed(2),
                          ),
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {Number(achievementRateLoan).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </td>
                    </tr>

                    <tr>
                      <td style={{ border: "1px solid black" }}>H5</td>
                      <td style={{ border: "1px solid black" }}>
                        <strong>
                          Special Mention Ratio(Portfolio){" "}
                        </strong>{" "}
                      </td>
                      <td
                        style={{
                          border: "1px solid black",
                          backgroundColor: getAchievementColor(
                            achievmentSpecialMentionLoan.toFixed(2),
                          ),
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {Number(achievmentSpecialMentionLoan).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
            : (user.position === "CRM" && user.organization === "Ho") ?
              (
                <div
                  style={{
                    width: "35%",
                    backgroundColor: "#c7dce5",
                    border: "2px solid black",
                    padding: "10px",
                  }}
                >
                  <h4>Health Metrics / KPI</h4>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid black" }}>S/N</th>
                        <th style={{ border: "1px solid black" }}>Metric</th>
                        <th
                          style={{
                            border: "1px solid black",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid black" }}>H1</td>
                        <td style={{ border: "1px solid black" }}>
                          <strong>Target Achievement Rate - Deposit</strong>{" "}
                        </td>
                        <td
                          style={{
                            border: "1px solid black",
                            backgroundColor: getAchievementColor(
                              achievementRateDeposit.toFixed(2),
                            ),
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          {Number(achievementRateDeposit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                      </tr>

                      <tr>
                        <td style={{ border: "1px solid black" }}>H2</td>
                        <td style={{ border: "1px solid black" }}>
                          <strong>Target Achievement Rate - FCY</strong>{" "}
                        </td>
                        <td
                          style={{
                            border: "1px solid black",
                            backgroundColor: getAchievementColor(
                              achievementRateFcy.toFixed(2),
                            ),
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          {Number(achievementRateFcy).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                      </tr>

                      <tr>
                        <td style={{ border: "1px solid black" }}>H3</td>
                        <td style={{ border: "1px solid black" }}>
                          <strong>
                            Loan Collection Performance against the plan
                          </strong>{" "}
                        </td>
                        <td
                          style={{
                            border: "1px solid black",
                            backgroundColor: getAchievementColor(
                              achievementRateLoan.toFixed(2),
                            ),
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          {Number(achievementRateLoan).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              )
              :
              (
                <div>
                  <h2>No Data Available</h2>
                </div>
              )
        }

      </div>

      {/* NEW ROW FOR BAU AND QUARTER OKR MONITORING */}
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        {/* BAU DIV */}
        <div
          style={{
            width: "50%",
            backgroundColor: "#d1fae5", // light emerald
            padding: "15px",
            border: "2px solid black",
          }}
        >
          <h4 style={{ fontWeight: "bold" }}>Business As Usual (BAU)</h4>
          {bauData.length > 0 ? (
            bauData.map((bau) => (
              <div key={bau.id} style={{ marginBottom: "15px", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "10px" }}>
                <h5 style={{ fontWeight: "bold", margin: "5px 0" }}>BAU: {bau.business_usual}</h5>
                {[1, 2, 3, 4, 5].map(num => bau[`resp${num}`] && (
                  <p key={num} style={{ margin: "2px 0", fontSize: "0.9rem" }}>
                    <strong>Resp {num}</strong>: {bau[`resp${num}`]}
                  </p>
                ))}
              </div>
            ))
          ) : (
            <p style={{ fontSize: "0.85rem", fontStyle: "italic" }}>No BAU records available</p>
          )}
        </div>

        {/* QUARTER OKR MONITORING DIV */}
        <div
          style={{
            width: "50%",
            backgroundColor: "#fef3c7", // light amber
            padding: "15px",
            border: "2px solid black",
          }}
        >
          <h4 style={{ fontWeight: "bold" }}>Quarter OKR Monitoring</h4>
          {quarterOkrData.length > 0 ? (
            quarterOkrData.map((q) => (
              <div key={q.id} style={{ marginBottom: "15px", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "10px" }}>
                <h5 style={{ fontWeight: "bold", margin: "5px 0" }}>Target KR: {q.kr}</h5>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[1, 2, 3, 4, 5].map(num => q[`month${num}`] && (
                    <Typography key={num} variant="caption" sx={{ bgcolor: "rgba(255,255,255,0.3)", px: 1, borderRadius: 1, fontWeight: 700 }}>
                      M{num}: {isNaN(q[`month${num}`]) ? q[`month${num}`] : Number(q[`month${num}`]).toLocaleString()}
                    </Typography>
                  ))}
                </Stack>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "0.85rem", fontStyle: "italic" }}>No Quarter Monitoring data available</p>
          )}
        </div>
      </div>
    </Box>
  );
};

export default Dashboard;
