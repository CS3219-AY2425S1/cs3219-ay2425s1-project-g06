import { ReactElement, useContext } from "react";
import "./Interview.scss";
import { Box, Typography } from "@mui/material";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import MatchingForm from "../../components/MatchingForm/MatchingForm";
import MatchingResult from "../../components/MatchingResult/MatchingResult";
import { UserContext } from "../../contexts/UserContext";
import { Categories, QuestionComplexity } from "../../models/question.model";
import { io } from "socket.io-client";
import { SessionContext, SessionState } from "../../contexts/SessionContext";
import { useMainDialog } from "../../contexts/MainDialogContext";

const WEBSOCKET_URL = process.env.REACT_APP_MATCHING_SERVICE_URL as string;

const Interview = (): ReactElement => {
  const { user } = useContext(UserContext);
  const {
    sessionState,
    userAccepted,
    otherUserAccepted,
    setSocket,
    setSessionState,
    setTopic,
    setDifficulty,
    setOtherUserId,
    accumulateMatchingTime,
    setLastMatchingStartTime,
    clearSession,
    setUserAccepted,
    setUserDeclined,
    setOtherUserAccepted,
    setOtherUserDeclined,
  } = useContext(SessionContext);
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();

  const socket = io(WEBSOCKET_URL, { autoConnect: false });

  socket.on("matched", (data: any) => {
    console.log("Matched with: ", data.matchedWith);
    setOtherUserId(data.matchedWith);
    accumulateMatchingTime();
    setSessionState(SessionState.PENDING);
  });

  socket.on("timeout", (message: string) => {
    console.log("Timeout: ", message);
    accumulateMatchingTime();
    setSessionState(SessionState.TIMEOUT);
  });

  socket.on("duplicate socket", (message: string) => {
    console.log("Duplicate socket: ", message);
    clearSession();
    setMainDialogTitle("Duplicate matching requests");
    setMainDialogContent(
      "Uh-oh, this matching is terminated due to another matching request from your account. Only one matching request is allowed at a time.",
    );
    openMainDialog();
  });

  socket.on("other_accepted", () => {
    console.log("Other user accepted");
    setOtherUserAccepted(true);
  });

  socket.on("other_declined", () => {
    console.log("Other user declined");
    setOtherUserDeclined(true);
  });

  socket.on("matching_success", () => {
    console.log("Matching succeeded");
    // if user did not accept, it means event not sent and should automatically accept
    if (!userAccepted) {
      setUserAccepted(true);
    }
    if (!otherUserAccepted) {
      setOtherUserAccepted(true);
    }
    setTimeout(() => {
      setSessionState(SessionState.SUCCESS);
    }, 1000); // smoother transition
  });

  socket.on("matching_fail", () => {
    console.log("Matching failed");
    // if user did not accept, it means timeout and should automatically decline
    if (!userAccepted) {
      setUserDeclined(true);
    }
    if (!otherUserAccepted) {
      setOtherUserDeclined(true);
    }
    setSessionState(SessionState.FAIL);
  });

  socket.on("error", () => {
    console.log("Unexpected error");
    clearSession();
    setMainDialogTitle("Error");
    setMainDialogContent("Your connection with the matching service is interrupted, please try again.");
    openMainDialog();
  });

  socket.on("connect_error", (error: any) => {
    console.log("Socket connection error: ", error);
    clearSession();
    setMainDialogTitle("Error");
    setMainDialogContent("Failed to connect to the matching service, please try again.");
    openMainDialog();
  });

  socket.on("connect_timeout", (timeout: any) => {
    console.log("Socket connection timeout: ", timeout);
    clearSession();
    setMainDialogTitle("Error");
    setMainDialogContent("Failed to connect to the matching service, please try again.");
    openMainDialog();
  });

  const startMatching = (topic: Categories, difficulty: QuestionComplexity) => {
    // restart
    clearSession();
    if (!user || !topic || !difficulty) {
      return;
    }
    socket.connect();
    setSocket(socket);
    socket.emit("matching_request", { userId: user.id, topic, difficulty });
    setLastMatchingStartTime(Date.now());
    setTopic(topic);
    setDifficulty(difficulty);
    setSessionState(SessionState.MATCHING);
  };

  const getSessionComponent = (): ReactElement => {
    switch (sessionState) {
      case SessionState.NOT_STARTED:
        return <MatchingForm startMatchingCallBack={startMatching} />;
      case SessionState.MATCHING:
      case SessionState.PENDING:
      case SessionState.TIMEOUT:
      case SessionState.FAIL:
      case SessionState.SUCCESS:
        return <MatchingResult startMatchingCallBack={startMatching} />;
      default:
        return <Typography variant="h5">An unexpected error occurred, please try again</Typography>;
    }
  };

  return (
    <Box className="Interview">
      <Navbar />
      {getSessionComponent()}
      <Footer />
    </Box>
  );
};

export default Interview;
