import { ReactElement, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, TextField, IconButton, InputAdornment, Alert, CircularProgress } from "@mui/material";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import "./Login.scss";
import UserService from "../../services/user.service";
import { UserContext } from "../../contexts/UserContext";
import { useMainDialog } from "../../contexts/MainDialogContext";
import { mapUserResponseToUserProfile } from "../../util/user.helper";

const Login = (): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { setUser } = useContext(UserContext);
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = () => {
    setMainDialogTitle("Work in Progress");
    setMainDialogContent("Password recovery is under construction. Check back in a future milestone!");
    openMainDialog();
  };

  const handleLogin = async () => {
    setErrors({});
    setLoginError(null);

    let formValid = true;
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      formValid = false;
      newErrors.email = "Email is required.";
    } else if (!validateEmail(email)) {
      formValid = false;
      newErrors.email = "Please enter a valid email.";
    }

    if (!password) {
      formValid = false;
      newErrors.password = "Password is required.";
    }

    if (!formValid) {
      setErrors(newErrors);
      return;
    }
    try {
      const data = await UserService.login(email, password);
      if (data instanceof Error) {
        setLoginError(data.message || "An unexpected error occurred.");
        return;
      }
      if (data) {
        setUser(mapUserResponseToUserProfile(data));
      } else {
        setLoginError("Invalid email or password. Please try again.");
      }
    } catch (error) {
      setLoginError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Box className="Login">
      <Navbar />

      <Box className="Login-container">
        <Box className="Login-header">
          <Typography variant="body2" className="Login-title">
            Login
          </Typography>
          <Typography className="Login-subtitle">Welcome back! Please log in to access your account.</Typography>
        </Box>

        <Box className="Login-form" sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {loading ? (
            <CircularProgress sx={{ mb: 3 }} />
          ) : (
            <>
              <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
                <TextField
                  label="Enter your Email"
                  variant="outlined"
                  fullWidth
                  sx={{ mr: 1 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  slotProps={{
                    input: {
                      className: "Login-input",
                    },
                  }}
                />
                <TextField
                  label="Enter your Password"
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  slotProps={{
                    input: {
                      className: "Login-input",
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={togglePasswordVisibility} className="Login-password-eye-icon" edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {loginError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {loginError}
                </Alert>
              )}

              <Button color="primary" variant="contained" className="Login-button" onClick={handleLogin}>
                Login
              </Button>

              <Box className="Login-prompts">
                <Button className="Login-forgot-password-button" color="secondary" onClick={handleForgotPassword}>
                  <Typography className="Login-forgot-password-text">Forgot password?</Typography>
                </Button>

                <Typography className="Login-signup">
                  Not registered yet? <a href="/signup">Sign Up</a>
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default Login;
