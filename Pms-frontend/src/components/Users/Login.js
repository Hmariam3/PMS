import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  LockOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const logo = "cooplogo.gif";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const baseUrlLdap = process.env.REACT_APP_LDAP_URL;
  const baseUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${baseUrlLdap}`,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (!res.data?.IsAuthenticated) {
        setError(res.data?.ErrorMessage || "Login failed");
        setLoading(false);
        return;
      }

      if (res.data.IsAuthenticated) {
        const MailAdress = res.data.MailAdress;
        try {
          const restitle = await axios.get(
            `${baseUrl}/employees/title/email`,
            {
              params: { email: MailAdress },
              timeout: 10000,
            }
          );

          const userWithTitel = {
            UserName: res.data.UserName,
            FullName: res.data.FullName,
            MailAdress: res.data.MailAdress,
            departement: res.data.departement,
            IsAuthenticated: res.data.IsAuthenticated,
            ErrorMessage: null,
            title: restitle.data.title_name,
            title_id: restitle.data.title_id,
            branch_grade: restitle.data.branch_grade,
          };

          const checkUser = await axios.get(
            `${baseUrl}/users/getUserByuserName/${res.data.UserName}`,
            {
              headers: {
                "x-api-key": process.env.REACT_APP_API_KEY,
              },
            }
          );

          if (checkUser?.data) {
            const userdata = {
              ...userWithTitel,
              process: checkUser.data.process,
              subprocess: checkUser.data.subprocess,
              team: checkUser.data.team,
              position: checkUser.data.position,
              organization: checkUser.data.organization,
              company_code: checkUser.data.company_code,
              cbsusername: checkUser.data.cbsusername,
              role: checkUser.data.role,
            };

            login(userdata);

            const orgUnit = userdata.organization || "";
            const pos = userdata.position || "";
            const isHO = orgUnit.toUpperCase() === "HO";
            const isDistrict = orgUnit.toLowerCase() === "do";
            const isDirector = pos.toLowerCase().includes("director");

            if (isHO || (isDistrict && isDirector)) {
              navigate("/");
            } else {
              navigate("/teamdashboard");
            }
            return;
          }

          localStorage.setItem("userdata", JSON.stringify(userWithTitel));
          navigate("/createprofile", {
            state: userWithTitel,
            replace: true,
          });
        } catch (err) {
          console.error("LOGIN ERROR", err);
          toast.error("Login failed: Employee data synchronization error.");
          if (err.response?.status === 404) {
            navigate("/createprofile", {
              state: res?.data,
            });
          } else {
            setError(
              err.response?.data?.ErrorMessage ||
              err.message ||
              "Something went wrong"
            );
          }
        }
      } else {
        setError(res.data.ErrorMessage || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        backgroundAttachment: "fixed",
        padding: 2,
        overflow: "hidden",
      }}
    >
      <Fade in={true} timeout={800}>
        <Container maxWidth="xs">
          <Paper
            elevation={12}
            sx={{
              padding: 4,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                width: "100%",
                maxWidth: 220,
                height: "auto",
                mb: 3,
                filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.1))",
              }}
            />

            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                mb: 1,
              }}
            >
              Welcome To
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                mb: 3,
                textAlign: "center",
              }}
            >
              Performance Management System
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ width: "100%", mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%" }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline sx={{ color: "action.active" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: "action.active" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                  mb: 3,
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  backgroundColor: "#1b3fcd",
                  "&:hover": {
                    backgroundColor: "#1532a1",
                  },
                  boxShadow: "0px 4px 12px rgba(27, 63, 205, 0.3)",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>

              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mt: 2 }}
              >
                {"© "}
                {new Date().getFullYear()} Cooperative Bank of Oromia
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Fade>
    </Box>
  );
};

export default Login;

