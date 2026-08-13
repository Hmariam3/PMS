import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

import Dashboard from "./pages/Dashboard";
import DashboardTeam from "./pages/DashboardTeam";
import Projects from "./pages/Projects";
import Users from "./components/Users/UserList";
import UserTransfer from "./components/Users/UserTransfer";
import EmployeeList from "./components/Employees/EmployeeList";
import ProcessHierarchy from "./components/Config/ProcessHierarchy";
import GeneralConfig from "./components/Config/GeneralConfig";
import Login from "./components/Users/Login";
import Register from "./components/Users/Register";
import PillarList from "./components/OKR/PillarList";
import ObjectiveList from "./components/OKR/ObjectiveList";
import PerformanceMetricList from "./components/OKR/PerformanceMetricList";
import MetricUpload from "./components/Admin/MetricUpload";

import PerformanceMetricByTitle from "./components/OKR/PerformanceMetricByTitle";
import MyTeam from "./components/MyTeam/MyTeam";
import Feedbacks from "./components/MyTeam/Feedbacks";
import MyFeedbacks from "./components/MyTeam/MyFeedbacks";
import EvaluationList from "./components/OKR/EvaluationList";
import UserObjectiveEvaluations from "./components/OKR/UserObjectiveEvaluations";
import UserObjectiveEvaluationsMy from "./components/OKR/UserObjectiveEvaluationsMy";
//for one page okr
import OnePageObjectiveList from "./components/OnePageOKR/OnePageObjectiveList";
import OnePageKRList from "./components/OnePageOKR/OnePageKRList";
import AccountMappingList from "./components/OnePageOKR/AccountMappingList";
import AccountMappingListFCY from "./components/OnePageOKR/AccountMappingListFCY";
import TargetList from "./components/OnePageOKR/TargetList";
import NonDepositTargetList from "./components/OnePageOKR/NonDepositTargetList";
import FCYCollectionList from "./components/OnePageOKR/FCYCollectionList";
import LoanCollectionList from "./components/OnePageOKR/LoanCollectionList";
import PriorityList from "./components/OnePageOKR/PriorityList";
import IFBList from "./components/OnePageOKR/IFBList ";

import BusinessAsUsualList from "./components/OnePageOKR/BusinessAsUsualList";
import QuarterOKRList from "./components/OnePageOKR/QuarterOKRList";
import LoanAccountMappingList from "./components/OnePageOKR/LoanAccountMappingList";
import DistrictMappingList from "./components/OnePageOKR/DistrictMappingList";
import FCYDepositList from "./components/OnePageOKR/FCYDepositList";
import EngagementList from "./components/OnePageOKR/EngagementList";
import UserTargetsReport from "./components/Reports/UserTargetsReport";
import AccountMappingReport from "./components/Reports/AccountMappingReport";
import AccountVariationReport from "./components/Reports/AccountVariationReport";
import FcyDepositReport from "./components/Reports/FcyDepositReport";
import EvaluationResultReport from "./components/Reports/EvaluationResultReport";
import RawPerformanceEvaluationsReport from "./components/Reports/RawPerformanceEvaluationsReport";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./AuthContext";
import { useMediaQuery, useTheme, Box } from "@mui/material";

const drawerWidth = 240;

function App() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const timeoutRef = React.useRef(null);
  const TIMEOUT_DURATION = 10 * 60 * 1000; // 15 minutes

  const resetTimeout = React.useCallback(() => {
    const now = Date.now();
    localStorage.setItem("lastActivity", now.toString());

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, TIMEOUT_DURATION);
    }
  }, [isAuthenticated, logout]);

  React.useEffect(() => {
    // Check for timeout on mount (persistence across tabs/reloads)
    const checkTimeoutOnMount = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (lastActivity && isAuthenticated) {
        const now = Date.now();
        if (now - parseInt(lastActivity, 10) > TIMEOUT_DURATION) {
          logout();
          window.location.href = "/login";
        }
      }
    };

    checkTimeoutOnMount();

    const events = ["mousemove", "keydown", "scroll", "click"];
    const handleActivity = () => resetTimeout();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimeout();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimeout, isAuthenticated]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {isAuthenticated && (
        <>
          <Navbar
            handleDrawerToggle={handleDrawerToggle}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            drawerWidth={isCollapsed ? 64 : drawerWidth}
          />
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Sidebar
            mobileOpen={mobileOpen}
            handleDrawerToggle={handleDrawerToggle}
            isCollapsed={isCollapsed}
            drawerWidth={isCollapsed ? 64 : drawerWidth}
          />
        </>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          paddingTop: isAuthenticated ? "64px" : 0,
          marginLeft: isAuthenticated && !isMobile ? `${isCollapsed ? 64 : drawerWidth}px` : 0,
          height: "100vh",
          overflowY: isAuthenticated ? "auto" : "hidden",
          backgroundColor: "#f8fafc",
          transition: theme.transitions.create(["margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Box sx={{ p: isAuthenticated ? 3 : 0 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/createprofile" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teamdashboard"
              element={
                <ProtectedRoute>
                  <DashboardTeam />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/transfer"
              element={
                <ProtectedRoute>
                  <UserTransfer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/metric-upload"
              element={
                <ProtectedRoute>
                  <MetricUpload />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hierarchy"
              element={
                <ProtectedRoute>
                  <ProcessHierarchy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/general-config"
              element={
                <ProtectedRoute>
                  <GeneralConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pillars"
              element={
                <ProtectedRoute>
                  <PillarList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/objective"
              element={
                <ProtectedRoute>
                  <ObjectiveList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performancemetrics"
              element={
                <ProtectedRoute>
                  <PerformanceMetricList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluation"
              element={
                <ProtectedRoute>
                  <EvaluationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/yourperformance"
              element={
                <ProtectedRoute>
                  <PerformanceMetricByTitle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/myteam"
              element={
                <ProtectedRoute>
                  <MyTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Feedbacks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/myfeedback"
              element={
                <ProtectedRoute>
                  <MyFeedbacks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/score"
              element={
                <ProtectedRoute>
                  <UserObjectiveEvaluations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/myscore"
              element={
                <ProtectedRoute>
                  <UserObjectiveEvaluationsMy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onepageobjective"
              element={
                <ProtectedRoute>
                  <OnePageObjectiveList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyresult"
              element={
                <ProtectedRoute>
                  <OnePageKRList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountmapping"
              element={
                <ProtectedRoute>
                  <AccountMappingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loanaccountmapping"
              element={
                <ProtectedRoute>
                  <LoanAccountMappingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/districtmapping"
              element={
                <ProtectedRoute>
                  <DistrictMappingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fcy-deposit"
              element={
                <ProtectedRoute>
                  <FCYDepositList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/engagement"
              element={
                <ProtectedRoute>
                  <EngagementList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/target"
              element={
                <ProtectedRoute>
                  <TargetList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nondeposittarget"
              element={
                <ProtectedRoute>
                  <NonDepositTargetList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fcycollection"
              element={
                <ProtectedRoute>
                  <FCYCollectionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loancollection"
              element={
                <ProtectedRoute>
                  <LoanCollectionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prioritylist"
              element={
                <ProtectedRoute>
                  <PriorityList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ifb"
              element={
                <ProtectedRoute>
                  <IFBList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/fcyaccountmapping"
              element={
                <ProtectedRoute>
                  <AccountMappingListFCY />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bau"
              element={
                <ProtectedRoute>
                  <BusinessAsUsualList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quarter-okr"
              element={
                <ProtectedRoute>
                  <QuarterOKRList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/user-targets"
              element={
                <ProtectedRoute>
                  <UserTargetsReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/account-mapping"
              element={
                <ProtectedRoute>
                  <AccountMappingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/account-variation"
              element={
                <ProtectedRoute>
                  <AccountVariationReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/fcy-deposit"
              element={
                <ProtectedRoute>
                  <FcyDepositReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/evaluation-result"
              element={
                <ProtectedRoute>
                  <EvaluationResultReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/raw-evaluations"
              element={
                <ProtectedRoute>
                  <RawPerformanceEvaluationsReport />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Box>
        {isAuthenticated && (
          <>
            <Footer />
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;
