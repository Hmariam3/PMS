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
import EmployeeList from "./components/Employees/EmployeeList";
import ProcessList from "./components/Config/ProcessList";
import SubProcessList from "./components/Config/SubProcessList";
import BranchList from "./components/Config/BranchList";
import JobLevelList from "./components/Config/JobLevelList";
import PayGradeList from "./components/Config/PayGradeList";
import TitleList from "./components/Config/TitleList";
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
import BranchListGrade from "./components/Config/BranchListGrade";
import BusinessAsUsualList from "./components/OnePageOKR/BusinessAsUsualList";
import QuarterOKRList from "./components/OnePageOKR/QuarterOKRList";
import LoanAccountMappingList from "./components/OnePageOKR/LoanAccountMappingList";
import DistrictMappingList from "./components/OnePageOKR/DistrictMappingList";
import FCYDepositList from "./components/OnePageOKR/FCYDepositList";
import EngagementList from "./components/OnePageOKR/EngagementList";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./AuthContext";
import { useMediaQuery, useTheme, Box } from "@mui/material";

const drawerWidth = 240;

function App() {
  const { isAuthenticated } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {isAuthenticated && (
        <>
          <Navbar
            handleDrawerToggle={handleDrawerToggle}
            drawerWidth={drawerWidth}
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
            drawerWidth={drawerWidth}
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
          marginLeft: isAuthenticated && !isMobile ? `${drawerWidth}px` : 0,
          height: "100vh",
          overflowY: isAuthenticated ? "auto" : "hidden",
          backgroundColor: "#f8fafc",
          transition: theme.transitions.create(["margin", "width"], {
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
              path="/proceses"
              element={
                <ProtectedRoute>
                  <ProcessList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subprocess"
              element={
                <ProtectedRoute>
                  <SubProcessList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch"
              element={
                <ProtectedRoute>
                  <BranchList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/joblevel"
              element={
                <ProtectedRoute>
                  <JobLevelList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/paygrade"
              element={
                <ProtectedRoute>
                  <PayGradeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/title"
              element={
                <ProtectedRoute>
                  <TitleList />
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
              path="/branchgrade"
              element={
                <ProtectedRoute>
                  <BranchListGrade />
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
