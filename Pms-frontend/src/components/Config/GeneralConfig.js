import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, Breadcrumbs, Stack } from "@mui/material";
import TitleList from "./TitleList";
import JobLevelList from "./JobLevelList";
import BranchGradeList from "./BranchListGrade";
import PayGradeList from "./PayGradeList";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const GeneralConfig = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '600px' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            General Configurations
          </Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
            <Typography color="text.primary">Configuration</Typography>
            <Typography color="text.primary">General</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="general configuration tabs">
          <Tab label="Titles" {...a11yProps(0)} />
          <Tab label="Job Levels" {...a11yProps(1)} />
          <Tab label="Branch Grades" {...a11yProps(2)} />
          <Tab label="Pay Grades" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <CustomTabPanel value={value} index={0}>
        <TitleList />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <JobLevelList />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <BranchGradeList />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <PayGradeList />
      </CustomTabPanel>
    </Box>
  );
};

export default GeneralConfig;
