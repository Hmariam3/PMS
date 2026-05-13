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

import { AuthContext } from "../AuthContext";

const getNavLinks = (user) => {
  const role = user?.role || "";
  const position = user?.position || "";
  const orgUnit = user?.organization || "";

  const isAdmin = role === "Admin";
  const isHO = orgUnit === "Ho";
  const isDistrict = orgUnit === "District";
  const isBranch = orgUnit === "Branch";
  const isDirector = position.includes("Director");
  const isCRM = position === "CRM";
  const isIndividual = position === "Individual";

  return [
    {
      text: "Dashboard",
      path: "/",
      icon: <DashboardIcon />,
      show: isHO || isDistrict || isDirector,
    },
    {
      text: "Team Dashboard",
      path: "/teamdashboard",
      icon: <GroupWorkIcon />,
      show: true,
    },
    {
      text: "Employees",
      path: "/employees",
      icon: <BadgeIcon />,
      show: isAdmin,
    },
    {
      text: "Users",
      icon: <ManageAccountsIcon />,
      show: isAdmin,
      children: [
        { text: "All Users", path: "/users", icon: <PeopleIcon />, show: isAdmin },
        { text: "Admins", path: "/admins", icon: <AdminPanelSettingsIcon />, show: isAdmin },
      ],
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      show: isAdmin,
      children: [
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
      icon: <TrackChangesIcon />,
      show: isHO || (isDistrict && isDirector || isAdmin),
      children: [
        { text: "Objectives", path: "/onepageobjective", icon: <DashboardIcon />, show: isHO || (isDistrict && isDirector) },
        { text: "Key Result", path: "/keyresult", icon: <ListAltIcon />, show: isHO || (isDistrict && isDirector) },
        { text: "Priority List", path: "/prioritylist", icon: <ListAltIcon />, show: isHO || (isDistrict && isDirector) },
        { text: "Business As Usual", path: "/bau", icon: <ListAltIcon />, show: isHO || (isDistrict && isDirector) },
        { text: "Quarter OKR", path: "/quarter-okr", icon: <ScoreboardIcon />, show: isHO || (isDistrict && isDirector) },
        { text: "Engagement", path: "/engagement", icon: <ListAltIcon />, show: isCRM || (isDistrict && isDirector) || isAdmin },
      ],
    },
    {
      text: "Set Target",
      icon: <TrackChangesIcon />,
      show: isBranch || isCRM || isAdmin,
      children: [
        { text: "Account Mapping", path: "/accountmapping", icon: <DashboardIcon />, show: isBranch || isCRM || isAdmin },
        { text: "FCY Account Mapping", path: "/fcyaccountmapping", icon: <ListAltIcon />, show: isBranch || isCRM || isAdmin },
        { text: "FCY Deposit", path: "/fcy-deposit", icon: <ListAltIcon />, show: isBranch || isCRM || isAdmin },
        { text: "Loan Account Mapping", path: "/loanaccountmapping", icon: <ListAltIcon />, show: isCRM || isAdmin },
        { text: "District Mapping", path: "/districtmapping", icon: <ListAltIcon />, show: isCRM || isAdmin },
        { text: "Financial Target", path: "/target", icon: <ListAltIcon />, show: isBranch || isCRM || isAdmin },
        { text: "Non Financial Target", path: "/nondeposittarget", icon: <TrackChangesIcon />, show: isBranch || isCRM || isAdmin },
      ],
    },
    {
      text: "PMS",
      icon: <AssessmentIcon />,
      show: true,
      children: [
        { text: "Strategic Pillars", path: "/pillars", icon: <AccountTreeIcon />, show: isAdmin },
        { text: "Objectives", path: "/objective", icon: <DashboardIcon />, show: isAdmin },
        { text: "Performance Metrics", path: "/performancemetrics", icon: <AutoGraphIcon />, show: isAdmin },
        { text: "My Team", path: "/myteam", icon: <GroupWorkIcon />, show: !isIndividual },
        { text: "Team Feedback", path: "/feedback", icon: <ThumbsUpDownIcon />, show: !isIndividual },
        { text: "Evaluation", path: "/evaluation", icon: <AssignmentTurnedInIcon />, show: isAdmin },
        { text: "Team Score", path: "/score", icon: <ScoreboardIcon />, show: !isIndividual },
        { text: "Your Performance Metrics", path: "/yourperformance", icon: <AutoGraphIcon />, show: true },
        { text: "My Feedback", path: "/myfeedback", icon: <ThumbsUpDownIcon />, show: isIndividual },
        { text: "My Score", path: "/myscore", icon: <ScoreboardIcon />, show: isIndividual },
      ],
    },
  ];
};

const Sidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
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
    <List>
      {filteredNavLinks.map((link) => (
        <React.Fragment key={link.text}>
          {/* Main Menu */}
          <ListItemButton
            component={link.path ? Link : "div"}
            to={link.path || "#"}
            onClick={() =>
              link.children ? handleMenuClick(link.text) : handleDrawerToggle()
            }
            selected={location.pathname === link.path}
            sx={{
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
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
            <ListItemIcon sx={{ minWidth: 40 }}>{link.icon}</ListItemIcon>
            <ListItemText primary={link.text} primaryTypographyProps={{ fontWeight: 500 }} />

            {link.children &&
              (openMenu === link.text ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>

          {/* Sub Menu */}
          {link.children && (
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
            top: 64,
            height: "calc(100% - 64px)",
            overflowY: "auto",
            borderRight: "1px solid #e2e8f0",
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
            overflowY: "auto",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
