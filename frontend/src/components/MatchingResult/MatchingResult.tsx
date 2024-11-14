import { ReactElement, useContext } from "react";
import { Box, Button, Typography } from "@mui/material";
import "./MatchingResult.scss";
import CountUpTimer from "../CountUpTimer/CountUpTimer";
import { UserContext } from "../../contexts/UserContext";
import Bridge from "../../assets/bridge.svg";
import { Code, Whatshot } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import UnknownUser from "../../assets/unknown_user.png";
import { SessionContext, SessionState } from "../../contexts/SessionContext";
import { useMainDialog } from "../../contexts/MainDialogContext";

const MatchingResult = (props: { startMatchingCallBack: any }): ReactElement => {
  const { user } = useContext(UserContext);
  const {
    socket,
    sessionState,
    topic,
    difficulty,
    otherUserProfile,
    userAccepted,
    userDeclined,
    otherUserAccepted,
    otherUserDeclined,
    setSessionState,
    setLastMatchingStartTime,
    //incrementMatchCount,
    clearSession,
    setUserAccepted,
    setUserDeclined,
    setOtherUserAccepted,
    setOtherUserDeclined,
  } = useContext(SessionContext);
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();
  const { startMatchingCallBack } = props;
  const navigate = useNavigate();

  const displayConnectionError = () => {
    // for handling error with session socket or user
    clearSession();
    setMainDialogTitle("Error");
    setMainDialogContent("Your connection with the matching service is interrupted, please try again.");
    openMainDialog();
  };

  const chooseCancle = () => {
    clearSession();
  };

  const chooseContinue = () => {
    if (user && socket && socket.connected) {
      socket.emit("matching_request", { userId: user.id, topic, difficulty });
      setLastMatchingStartTime(Date.now());
      //incrementMatchCount();

      // clear the accepted and declined states
      setUserAccepted(false);
      setUserDeclined(false);
      setOtherUserAccepted(false);
      setOtherUserDeclined(false);
      setSessionState(SessionState.MATCHING);
    } else {
      displayConnectionError();
    }
  };

  const chooseRetry = () => {
    startMatchingCallBack(topic, difficulty);
  };

  const chooseAccept = () => {
    if (user && socket && socket.connected) {
      socket.emit("matching_confirm", { userId: user.id });
      setUserAccepted(true);
    } else {
      displayConnectionError();
    }
  };

  const chooseDecline = () => {
    if (user && socket && socket.connected) {
      socket.emit("matching_decline", { userId: user.id });
      setUserDeclined(true);
    } else {
      displayConnectionError();
    }
  };

  if (!user) {
    navigate("/");
  }

  return sessionState === SessionState.SUCCESS ? (
    <Typography variant="h5" textAlign="center">
      Successfully matched {user?.username} with {otherUserProfile?.username}.
    </Typography>
  ) : (
    <Box>
      <Box className="MatchingResult-title">
        <Box className="MatchingResult-title-progress">
          <Typography className="MatchingResult-title-text">
            {sessionState === SessionState.MATCHING
              ? "Matching you with another coder..."
              : sessionState === SessionState.TIMEOUT
                ? "No partner found yet. Would you like to continue matching?"
                : sessionState === SessionState.FAIL
                  ? "Matching was declined. Would you like to retry matching?"
                  : "Partner found! Accept the session within 10 seconds"}
          </Typography>
          {sessionState === SessionState.MATCHING ? <CountUpTimer /> : <></>}
        </Box>

        <Box className="MatchingResult-users">
          <Box className="MatchingResult-users-profile">
            <img src={user!.avatar.toString()} alt="user1" className="MatchingResult-users-avatar" />
            <Typography className="MatchingResult-users-name">{user!.username.toString()}</Typography>
          </Box>

          <Box className="MatchingResult-users-bridge">
            <Box className="MatchingResult-users-bridge-infobox">
              <Whatshot className="MatchingResult-users-bridge-infobox-icon" />
              <Typography variant="h5" className="MatchingResult-users-bridge-text">
                {difficulty}
              </Typography>
            </Box>

            <Box className="MatchingResult-users-bridge-image-container">
              <img
                src={Bridge}
                alt="bridge"
                className={
                  userAccepted
                    ? "MatchingResult-users-bridge-image-left MatchingResult-users-bridge-image-accepted"
                    : userDeclined
                      ? "MatchingResult-users-bridge-image-left MatchingResult-users-bridge-image-declined"
                      : "MatchingResult-users-bridge-image-left"
                }
              />
              <img
                src={Bridge}
                alt="bridge"
                className={
                  otherUserAccepted
                    ? "MatchingResult-users-bridge-image-right MatchingResult-users-bridge-image-accepted"
                    : otherUserDeclined
                      ? "MatchingResult-users-bridge-image-right MatchingResult-users-bridge-image-declined"
                      : "MatchingResult-users-bridge-image-right"
                }
              />
            </Box>

            <Box className="MatchingResult-users-bridge-infobox">
              <Code className="MatchingResult-users-bridge-infobox-icon" />
              <Typography className="MatchingResult-users-bridge-text">{topic}</Typography>
            </Box>
          </Box>

          <Box className="MatchingResult-users-profile">
            <img
              src={otherUserProfile ? otherUserProfile.avatar.toString() : UnknownUser}
              alt="user2"
              className="MatchingResult-users-avatar"
            />
            <Typography className="MatchingResult-users-name">
              {otherUserProfile ? otherUserProfile.username.toString() : ""}
            </Typography>
          </Box>
        </Box>

        {sessionState === SessionState.MATCHING ||
        sessionState === SessionState.TIMEOUT ||
        sessionState === SessionState.FAIL ? (
          <Box className="MatchingResult-actions">
            <Button variant="contained" color="error" className="MatchingResult-actions-cancel" onClick={chooseCancle}>
              Cancel
            </Button>
            {sessionState === SessionState.TIMEOUT ? (
              <Button
                variant="contained"
                color="primary"
                className="MatchingResult-actions-continue"
                onClick={chooseContinue}
              >
                Continue
              </Button>
            ) : sessionState === SessionState.FAIL ? (
              <Button
                variant="contained"
                color="primary"
                className="MatchingResult-actions-continue"
                onClick={chooseRetry}
              >
                Retry
              </Button>
            ) : (
              <></>
            )}
          </Box>
        ) : !userAccepted && !userDeclined ? (
          <Box className="MatchingResult-actions">
            <Button
              variant="contained"
              color="primary"
              className="MatchingResult-actions-accept"
              onClick={chooseAccept}
            >
              Accept
            </Button>
            <Button
              variant="contained"
              color="error"
              className="MatchingResult-actions-decline"
              onClick={chooseDecline}
            >
              Decline
            </Button>
          </Box>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default MatchingResult;
