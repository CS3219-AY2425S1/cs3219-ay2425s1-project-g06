import { Box, Button, Typography } from "@mui/material";
import { ReactElement, useContext } from "react";
import "./RecentSessions.scss";
import { UserContext } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const RecentSessions = (): ReactElement => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const startNewSession = () => {
    if (user) {
      navigate("/interview");
    } else {
      navigate("login");
    }
  };

  return (
    <Box className="RecentSessions">
      <Typography className="RecentSessions-title">Recent Sessions</Typography>
      <Box className="RecentSessions-sessions">
        <Typography className="RecentSessions-sessions-text">
          Session history is under construction, check back in a future milestone!
        </Typography>
      </Box>
      <Typography className="RecentSessions-new-title">Technical Interview Prep Session</Typography>
      <Box className="RecentSessions-new">
        <Button className="RecentSessions-new-button" variant="outlined" onClick={startNewSession}>
          Start new session
        </Button>
      </Box>
    </Box>
  );
};

export default RecentSessions;
