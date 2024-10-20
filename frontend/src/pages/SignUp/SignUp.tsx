import { ReactElement, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, TextField, IconButton, InputAdornment, Alert, CircularProgress } from "@mui/material";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import "./SignUp.scss";
import UserService from "../../services/user.service";
import { UserValidationErrors, validateEmail, validateName, validatePassword } from "../../util/user.helper";

const SignUp = (): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setuserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<UserValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSignUp = async () => {
    setErrors({});
    setSignUpError(null);

    const errors: UserValidationErrors = {
      name: validateName(userName),
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setErrors(errors);

    if (errors.name || errors.email || errors.password) {
      return;
    }

    const data = await UserService.signup(email, password, userName);
    if (data instanceof Error) {
      setSignUpError(data.message || "An unexpected error occurred.");
      return;
    }
    navigate("/login");
  };

  return (
    <Box className="SignUp">
      <Navbar />

      <Box className="SignUp-container">
        <Box className="SignUp-header">
          <Typography className="SignUp-title">Sign Up</Typography>
          <Typography className="SignUp-subtitle">
            Empower your interview preparation today! Create an account to unlock exclusive features and personalized
            experiences.
          </Typography>
        </Box>

        <Box className="SignUp-form" sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {loading ? (
            <CircularProgress sx={{ mb: 3 }} />
          ) : (
            <>
              <Box sx={{ display: "flex", gap: 2, width: "100%", mb: 2 }}>
                <TextField
                  label="Displayed Name (to others)"
                  variant="outlined"
                  fullWidth
                  value={userName}
                  onChange={(e) => setuserName(e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  slotProps={{
                    input: {
                      className: "SignUp-input",
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, width: "100%", mb: 2 }}>
                <TextField
                  label="Email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  slotProps={{
                    input: {
                      className: "SignUp-input",
                    },
                  }}
                />
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  slotProps={{
                    input: {
                      className: "SignUp-input",
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            className="SignUp-password-eye-icon"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {signUpError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {signUpError}
                </Alert>
              )}

              <Button color="primary" variant="contained" className="SignUp-button" onClick={handleSignUp}>
                Sign Up
              </Button>

              <Typography className="SignUp-login">
                Already have an account? <a href="/login">Login</a>
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default SignUp;
