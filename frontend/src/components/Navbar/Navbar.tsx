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
      <Button className="Navbar-logo" onClick={redirectToHome}>
        <ApiIcon color="primary" />
        <Typography className="Navbar-title">LuckyJinx</Typography>
      </Button>
      <Box className="Navbar-buttons">
        {user ? (
          <Button color="primary" variant="contained" onClick={redirectToAccount}>
            <div style={{ padding: "0.5rem" }}>{user?.username}</div>
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
