import React, { useEffect, useState, useRef, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Button,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Fade,
} from "@mui/material";
import axios from "axios";
import MenuIcon from "@mui/icons-material/Menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
const Navbar = ({ handleDrawerToggle, drawerWidth, isCollapsed, setIsCollapsed }) => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
  // Notification state
  const [notifyCount, setNotifyCount] = useState(0);
  const [notifyUsers, setNotifyUsers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Profile dropdown state
  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const openProfile = Boolean(anchorElProfile);
  const handleProfileClick = (event) => {
    setAnchorElProfile(event.currentTarget);
  };
  const handleProfileClose = () => {
    setAnchorElProfile(null);
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {

        const res = await axios.post(
          `${baseUrl}/priorities/getUsersWithoutPriority`,
          {
            supervisor: user?.MailAdress,
          },
        );

        setNotifyCount(res.data.count);
        setNotifyUsers(res.data.result);
      } catch (err) {
        console.log(err);
      }
    };

    if (user?.MailAdress) {
      fetchNotifications();
    }
  }, [user]);
  const handleLogout = () => {
    // 1. Remove all user info
    logout(); // clear auth state
    navigate("/login"); // redirect to login
  };
  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer - 1,
        backgroundColor: "#00AEEF",
        width: isMobile ? "100%" : `calc(100% - ${drawerWidth}px)`,
        ml: isMobile ? 0 : `${drawerWidth}px`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        {/* Left: menu + logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setIsCollapsed(!isCollapsed)}
              sx={{ mr: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
          )}

          {/* Show logo in Navbar only when Sidebar is collapsed OR on mobile */}
          {(isCollapsed || isMobile) && (
            <Fade in={isCollapsed || isMobile}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  component="img"
                  src="/coplog.PNG"
                  alt="Logo"
                  sx={{ height: 40, width: "auto", mr: 1 }}
                />
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  PMS
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>

        {/* Right: profile + logout */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: { xs: 1, sm: 0 },
            flexWrap: "wrap",
          }}
        >
          {/* NOTIFICATION ICON */}
          <IconButton color="inherit" onClick={handleNotificationClick} sx={{ mr: 1, position: 'relative' }}>
            <NotificationsIcon />
            {notifyCount > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  backgroundColor: "error.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: "0.7rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {notifyCount}
              </Box>
            )}
          </IconButton>

          {/* PROFILE ICON & DROPDOWN */}
          <Box onClick={handleProfileClick} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 1 }}>
            <Avatar
              alt={user?.FullName || "User"}
              src="/profile.jpg"
              sx={{ width: 35, height: 35, mr: 1, border: '2px solid white' }}
            />
            {isAuthenticated && !isMobile && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  color: "white",
                }}
              >
                {user?.FullName || "User"}
              </Typography>
            )}
          </Box>
          <Menu
            anchorEl={anchorElProfile}
            open={openProfile}
            onClose={handleProfileClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: { mt: 1.5, minWidth: 150 },
            }}
          >
            <MenuItem disabled sx={{ opacity: "1 !important" }}>
              <Typography variant="body2" color="text.secondary">
                Signed in as <b>{user?.FullName || "User"}</b>
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleProfileClose(); handleLogout(); }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      {/*  NOTIFICATION POPUP */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {!Array.isArray(notifyUsers) || notifyUsers.length === 0 ? (
          <MenuItem onClick={handleClose}>No missing priorities</MenuItem>
        ) : (
          notifyUsers.map((user, index) => (
            <MenuItem key={index} onClick={handleClose}>
              {user.full_name} ({user.user_name})
            </MenuItem>
          ))
        )}
      </Menu>
    </AppBar>
  );
};

export default Navbar;
