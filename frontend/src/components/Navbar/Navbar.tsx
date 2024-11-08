import { Box, Button, Typography } from "@mui/material";
import { ReactElement, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./Navbar.scss";
import ApiIcon from "@mui/icons-material/Api";
import { UserContext } from "../../contexts/UserContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const Navbar = (): ReactElement => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const redirectToHome = () => {
    navigate("/", { replace: true }); // replace serves to prevent repeated navigations to same location
  };

  const redirectToQuestions = () => {
    navigate("/questions", { replace: true });
  };

  const redirectToInterview = () => {
    navigate("/interview", { replace: true });
  };

  const redirectToHistory = () => {
    navigate("/history", { replace: true });
  };

  const redirectToSignUp = () => {
    navigate("/signup", { replace: true });
  };

  const redirectToLogin = () => {
    navigate("/login", { replace: true });
  };

  const redirectToAccount = () => {
    navigate("/settings", { replace: true });
  };

  return (
    <nav className="Navbar">
      <Box className="Navbar-logo">
        <ApiIcon color="primary" />
        <Typography className="Navbar-title">LuckyJinx</Typography>
      </Box>
      <Box className="Navbar-links">
        <Button onClick={redirectToHome}>
          <Typography>Home</Typography>
        </Button>
        <Button onClick={redirectToQuestions}>
          <Typography>Questions</Typography>
        </Button>
        {user ? (
          <Button onClick={redirectToInterview}>
            <Typography>Interview</Typography>
          </Button>
        ) : (
          <></>
        )}
        {user ? (
          <Button onClick={redirectToHistory}>
            <Typography>History</Typography>
          </Button>
        ) : (
          <></>
        )}
      </Box>
      <Box className="Navbar-buttons">
        {user ? (
          <Button className="Navbar-buttons-profile" color="primary" variant="contained" onClick={redirectToAccount}>
            <Box className="Navbar-buttons-profile-text">{user?.username}</Box>
            <AccountCircleIcon />
          </Button>
        ) : (
          <>
            <Button color="secondary" variant="contained" onClick={redirectToSignUp}>
              Sign Up
            </Button>
            <Button color="primary" variant="contained" onClick={redirectToLogin}>
              Login
            </Button>
          </>
        )}
      </Box>
    </nav>
  );
};

export default Navbar;
