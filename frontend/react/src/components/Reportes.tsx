import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

import EstudiantesComponent from "./Estudiantes";
import ProfesoresComponent from "./ProfesoresReport";
import RepresentantesComponent from "./RepresentantesReporte";
import AdministradoresComponent from "./AdministradoresReporte";
import Typography from "@mui/material/Typography";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 1,
            width: "100%",
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 2,
              maxWidth: "100%",
            }}
          >
            {children}
          </Paper>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `report-tab-${index}`,
    "aria-controls": `report-tabpanel-${index}`,
  };
}

export default function ReportesTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
          pb: 2,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Generacion de reportes
        </Typography>
      </Box>
      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Estudiantes" {...a11yProps(0)} />
          <Tab label="Profesores" {...a11yProps(1)} />
          <Tab label="Representantes" {...a11yProps(2)} />
          <Tab label="Administradores" {...a11yProps(3)} />
        </Tabs>
      </Box>

      {/* TAB 1 */}
      <CustomTabPanel value={value} index={0}>
        <EstudiantesComponent />
      </CustomTabPanel>

      {/* TAB 2 */}
      <CustomTabPanel value={value} index={1}>
        <ProfesoresComponent />
      </CustomTabPanel>

      {/* TAB 3 */}
      <CustomTabPanel value={value} index={2}>
        <RepresentantesComponent />
      </CustomTabPanel>

      {/* TAB 4 */}
      <CustomTabPanel value={value} index={3}>
        <AdministradoresComponent />
      </CustomTabPanel>
    </Box>
  );
}
