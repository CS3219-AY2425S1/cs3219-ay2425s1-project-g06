import { Box, Button, Chip, Typography } from "@mui/material";
import { ReactElement, useContext, useEffect, useState } from "react";
import "./RecentSessions.scss";
import { UserContext } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import SessionService, { Language, SessionData } from "../../services/session.service";
import { SessionContext, SessionState } from "../../contexts/SessionContext";
import { AxiosError } from "axios";
import { useMainDialog } from "../../contexts/MainDialogContext";
import Spinner from "../Spinner/Spinner";

const RecentSessions = (): ReactElement => {
  const { user } = useContext(UserContext);
  const { setSessionState, setQuestionId, setRoomNumber, setOtherUserId } = useContext(SessionContext);
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();
  const navigate = useNavigate();
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessionHistory = async () => {
    setLoading(true);
    const sessions = await SessionService.getSessionHistory(user!.id as string);
    setSessionHistory(sessions);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchSessionHistory();
    }
  }, [user]);

  const startNewSession = () => {
    if (user) {
      navigate("/interview");
    } else {
      navigate("login");
    }
  };

  const findFirstOngoingSession = (sessions: SessionData[]): SessionData | undefined => {
    return sessions.find((session) => session.isOngoing);
  };

  const resumeSession = async (roomNumber: string) => {
    try {
      const rejoinResponse = await SessionService.rejoinSession(user!.id as string, roomNumber);
      setSessionState(SessionState.SUCCESS);
      setQuestionId(rejoinResponse.questionId);
      setRoomNumber(rejoinResponse.roomNumber);
      setOtherUserId(rejoinResponse.otherUserId);
      navigate(`/code-editor/${rejoinResponse.roomNumber}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          fetchSessionHistory();
          setMainDialogTitle("Too late");
          setMainDialogContent("The previous interview session has ended. Join another one instead!");
          openMainDialog();
          return;
        }
      }
      console.log(error);
      setMainDialogTitle("Error");
      setMainDialogContent("An error occurred while trying to resume the session.");
      openMainDialog();
    }
  };

  const viewSubmission = (questionId: number, language: Language | undefined, code: string | undefined) => {
    navigate("/view", { state: { questionId, language, code } });
  };

  return (
    <Box className="RecentSessions">
      <Typography className="RecentSessions-title" variant="h5">
        Recent Sessions
      </Typography>
      {loading ? (
        <Spinner />
      ) : (
        <Box className="RecentSessions-sessions">
          {!user ? (
            <Box className="RecentSessions-sessions-message">
              <Typography textAlign="center">Log in to view session history</Typography>
            </Box>
          ) : sessionHistory.length === 0 ? (
            <Box className="RecentSessions-sessions-message">
              <Typography className="RecentSessions-sessions-message" textAlign="center">
                No sessions yet
              </Typography>
            </Box>
          ) : (
            sessionHistory.map((session) => (
              <Box key={session.roomNumber} className="RecentSessions-session">
                <Box className="RecentSessions-session-info">
                  <Typography variant="body1" className="RecentSessions-session-info-text">
                    {`${session.questionId}. ${session.questionTitle}`}
                  </Typography>
                  <Typography variant="body2" className="RecentSessions-session-info-text">
                    {`With ${session.otherUserName}`}
                  </Typography>
                </Box>
                <Box>
                  {session.isOngoing ? (
                    <Chip
                      color="warning"
                      variant="outlined"
                      label="Ongoing"
                      onClick={() => resumeSession(session.roomNumber)}
                    ></Chip>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        viewSubmission(session.questionId, session.language, session.submission);
                      }}
                    >
                      <Typography variant="body2">View</Typography>
                    </Button>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}
      <Box className="RecentSessions-new">
        {findFirstOngoingSession(sessionHistory) ? (
          <Button
            className="RecentSessions-new-button"
            variant="outlined"
            onClick={() => {
              resumeSession(findFirstOngoingSession(sessionHistory)!.roomNumber);
            }}
          >
            Resume ongoing session
          </Button>
        ) : (
          <Button className="RecentSessions-new-button" variant="outlined" onClick={startNewSession}>
            Start new session
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default RecentSessions;
