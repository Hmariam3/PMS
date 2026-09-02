import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = ({ drawerWidth = 240 }) => {
  return (
    <Box
      component="footer"
      sx={{
        textAlign: "center",
        py: 3,
        mt: "auto",
        backgroundColor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        width: "100%",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} PMS System.
      </Typography>
    </Box>
  );
};

export default Footer;