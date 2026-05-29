import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Collapse,
  useTheme,
  Box,
  Typography,
  Tooltip,
  Divider,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

// Icons for main categories
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import BadgeIcon from "@mui/icons-material/Badge";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SettingsIcon from "@mui/icons-material/Settings";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import AssessmentIcon from "@mui/icons-material/Assessment";

// Icons for sub-items
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ThumbsUpDownIcon from "@mui/icons-material/ThumbsUpDown";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import LinkIcon from "@mui/icons-material/Link";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import SavingsIcon from "@mui/icons-material/Savings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MapIcon from "@mui/icons-material/Map";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import BarChartIcon from "@mui/icons-material/BarChart";
import FlagIcon from "@mui/icons-material/Flag";
import PieChartIcon from "@mui/icons-material/PieChart";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PsychologyIcon from "@mui/icons-material/Psychology";

import { AuthContext } from "../AuthContext";

const getNavLinks = (user) => {
  const role = user?.role || "";
  const position = user?.position || "";
  const orgUnit = user?.organization || "";
  const process = user?.process || "";

  const isAdmin = role === "Admin";
  const isHO = orgUnit === "Ho";
  const isDo = orgUnit === "Do";
  const isDistrict = orgUnit === "Do";
  const isBranch = orgUnit === "Branch";
  const isDirector = position.includes("Director");
  const isCRM = position === "CRM";
  const isIndividual = position === "Individual";
  const isVPOrCHF = position.includes("VP") || position.includes("CHF");
  const isIFB = process === "Interest Free Banking";


  return [
    {
      text: "Dashboard",
      path: "/",
      icon: <DashboardIcon />,
      show: isHO || (isDistrict && isDirector) || isVPOrCHF,
    },
    {
      text: "Team Dashboard",
      path: "/teamdashboard",
      icon: <GroupWorkIcon />,
      show: true,
    },
    // {
    //   text: "Employees",
    //   path: "/employees",
    //   icon: <BadgeIcon />,
    //   show: isAdmin,
    // },
    // {
    //   text: "Users",
    //   icon: <ManageAccountsIcon />,
    //   show: isAdmin,
    //   children: [
    //     { text: "All Users", path: "/users", icon: <PeopleIcon />, show: isAdmin },
    //     { text: "Admins", path: "/admins", icon: <AdminPanelSettingsIcon />, show: isAdmin },
    //   ],
    // },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      show: isAdmin,
      children: [
        { text: "Manage Users", path: "/users", icon: <PeopleIcon />, show: isAdmin },
        { text: "Employee Master", path: "/employees", icon: <BadgeIcon />, show: isAdmin },
        { text: "Proceses", path: "/proceses", icon: <WorkIcon />, show: isAdmin },
        { text: "Sub Process", path: "/subprocess", icon: <AccountTreeIcon />, show: isAdmin },
        { text: "Branch", path: "/branch", icon: <BusinessIcon />, show: isAdmin },
        { text: "Branch Grade", path: "/branchgrade", icon: <StarBorderIcon />, show: isAdmin },
        { text: "Title", path: "/title", icon: <BadgeIcon />, show: isAdmin },
        { text: "Job Level", path: "/joblevel", icon: <WorkIcon />, show: isAdmin },
        { text: "Pay Grade", path: "/paygrade", icon: <MonetizationOnIcon />, show: isAdmin },
        { text: "Metric Upload", path: "/admin/metric-upload", icon: <CloudUploadIcon />, show: isAdmin },
      ],

    },
    {
      text: "One Page OKR",
      icon: <EmojiEventsIcon />,
      show: isHO || (isDistrict && isDirector) || isAdmin || isVPOrCHF,
      children: [
        { text: "Objectives", path: "/onepageobjective", icon: <FlagIcon />, show: isHO || (isDistrict && isDirector) || isVPOrCHF },
        { text: "Key Result", path: "/keyresult", icon: <ChecklistIcon />, show: isHO || (isDistrict && isDirector) || isVPOrCHF },
        { text: "Priority List", path: "/prioritylist", icon: <ListAltIcon />, show: isHO || (isDistrict && isDirector) || isVPOrCHF },
        { text: "Business As Usual", path: "/bau", icon: <WorkIcon />, show: isHO || (isDistrict && isDirector) || isVPOrCHF },
        { text: "Quarter OKR", path: "/quarter-okr", icon: <PieChartIcon />, show: isHO || (isDistrict && isDirector) || isVPOrCHF },
        { text: "Engagement", path: "/engagement", icon: <PsychologyIcon />, show: isCRM || (isDistrict && isDirector) || isAdmin || isVPOrCHF },
      ],
    },
    {
      text: "Set Target",
      icon: <GpsFixedIcon />,
      show: isBranch || isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo,
      children: [
        { text: "Local Account Mapping", path: "/accountmapping", icon: <LinkIcon />, show: isBranch || isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo },
        { text: "FCY Account Mapping", path: "/fcyaccountmapping", icon: <CurrencyExchangeIcon />, show: isBranch || isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo },
        { text: "FCY Generation", path: "/fcy-deposit", icon: <SavingsIcon />, show: isBranch || isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo },
        { text: "Loan Account Mapping", path: "/loanaccountmapping", icon: <AccountBalanceWalletIcon />, show: isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo },
        { text: "District Mapping", path: "/districtmapping", icon: <MapIcon />, show: isCRM || isAdmin || isIFB },
        { text: "Financial Target", path: "/target", icon: <AccountBalanceIcon />, show: isBranch || isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo },
        { text: "Non Financial Target", path: "/nondeposittarget", icon: <TrackChangesIcon />, show: isBranch || isCRM || isAdmin || (isDistrict && isDirector) || isVPOrCHF || isIFB || isDo },
      ],
    },
    {
      text: "PMS",
      icon: <AssessmentIcon />,
      show: true,
      children: [
        { text: "Strategic Pillars", path: "/pillars", icon: <AccountTreeIcon />, show: isAdmin },
        { text: "Objectives", path: "/objective", icon: <FlagIcon />, show: isAdmin },
        { text: "Performance Metrics", path: "/performancemetrics", icon: <BarChartIcon />, show: isAdmin },
        { text: "My Team", path: "/myteam", icon: <PeopleIcon />, show: !isIndividual || isAdmin },
        { text: "Team Feedback", path: "/feedback", icon: <ThumbsUpDownIcon />, show: !isIndividual },
        { text: "Evaluation", path: "/evaluation", icon: <AssignmentTurnedInIcon />, show: isAdmin },
        { text: "Team Score", path: "/score", icon: <ScoreboardIcon />, show: !isIndividual },
        { text: "My Performance Metrics", path: "/yourperformance", icon: <AutoGraphIcon />, show: true },
        { text: "My Feedback", path: "/myfeedback", icon: <ThumbsUpDownIcon />, show: isIndividual },
        { text: "My Score", path: "/myscore", icon: <ScoreboardIcon />, show: isIndividual },
      ],
    },
  ];
};

const Sidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth, isCollapsed }) => {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [openMenu, setOpenMenu] = useState(null);
  const rawNavLinks = getNavLinks(user || {});

  const filteredNavLinks = rawNavLinks
    .filter((item) => item.show !== false)
    .map((item) => {
      if (!item.children) return item;

      return {
        ...item,
        children: item.children.filter((child) => child.show !== false),
      };
    })
    .filter((item) => !item.children || item.children.length > 0);

  const handleMenuClick = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sidebar Header with Logo (Hidden when collapsed) */}
      {!isCollapsed && (
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Box
            component="img"
            src="/cooplogo.gif"
            alt="Logo"
            sx={{ height: 34, width: "auto" }}
          />
          <Typography
            variant="h1"
            sx={{ fontWeight: "bold", color: "#00AEEF", fontSize: "2rem" }}
          >
            PMS
          </Typography>
        </Box>
      )}

      <List sx={{ flexGrow: 1, pt: isCollapsed ? 1 : 0, overflowY: "auto" }}>
        {filteredNavLinks.map((link) => (
          <React.Fragment key={link.text}>
            {/* Main Menu */}
            <Tooltip title={isCollapsed ? link.text : ""} placement="right">
              <ListItemButton
                component={link.path ? Link : "div"}
                to={link.path || "#"}
                onClick={() =>
                  link.children ? handleMenuClick(link.text) : handleDrawerToggle()
                }
                selected={location.pathname === link.path}
                sx={{
                  mb: 0.5,
                  mx: isCollapsed ? 0.5 : 1,
                  borderRadius: 1,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.info.main,
                    color: theme.palette.common.white,
                    "&:hover": {
                      backgroundColor: theme.palette.info.dark,
                    },
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.common.white,
                    },
                  },
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 0 : 40,
                    mr: isCollapsed ? 0 : 0,
                    justifyContent: "center",
                  }}
                >
                  {link.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={link.text}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                )}

                {!isCollapsed && link.children && (
                  openMenu === link.text ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </Tooltip>

            {/* Sub Menu */}
            {link.children && !isCollapsed && (
              <Collapse in={openMenu === link.text} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {link.children.map((sub) => (
                    <ListItemButton
                      key={sub.text}
                      component={Link}
                      to={sub.path}
                      sx={{
                        pl: 4,
                        mb: 0.5,
                        mx: 1,
                        borderRadius: 1,
                        "&.Mui-selected": {
                          backgroundColor: theme.palette.action.selected,
                          "& .MuiListItemIcon-root": {
                            color: theme.palette.primary.main,
                          },
                          "& .MuiListItemText-primary": {
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                          },
                        },
                      }}
                      onClick={handleDrawerToggle}
                      selected={location.pathname === sub.path}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>{sub.icon}</ListItemIcon>
                      <ListItemText primary={sub.text} primaryTypographyProps={{ fontSize: "0.9rem" }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            top: 0,
            height: "100%",
            overflow: "hidden", // Disable scroll on the drawer paper itself
            borderRight: "1px solid #e2e8f0",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            top: 0,
            height: "100%",
            overflow: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
