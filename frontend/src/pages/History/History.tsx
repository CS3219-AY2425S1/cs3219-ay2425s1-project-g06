import { ReactElement, useContext, useEffect, useState } from "react";
import styles from "./History.module.scss";
import Navbar from "../../components/Navbar/Navbar";
import { Box, Button, Typography } from "@mui/material";
import Footer from "../../components/Footer/Footer";
import Spinner from "../../components/Spinner/Spinner";
import SessionService, { Language, SessionData } from "../../services/session.service";
import { UserContext } from "../../contexts/UserContext";
import { AxiosError } from "axios";
import { useMainDialog } from "../../contexts/MainDialogContext";
import { useNavigate } from "react-router-dom";

type SortOrder = "asc" | "desc";
type SortColumn = "createdAt" | "questionId" | "otherUserName";

const History = (): ReactElement => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);

  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");

  useEffect(() => {
    const fetchSessionHistory = async () => {
      // for now, fetch the 20 most recent sessions, TODO pagination
      try {
        setLoading(true);
        const sessionHistory = await SessionService.getSessionHistory(user?.id as string, 20);
        setSessionHistory(sessionHistory.filter((session) => session.isOngoing === false));
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.message);
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessionHistory();
    }
  }, [user]);

  const chooseSortByColumn = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    console.log(sortColumn, sortOrder);
  };

  const handleSort = () => {
    const sortedSessionHistory = [...sessionHistory].sort((s1, s2) => {
      if (sortColumn === "createdAt") {
        if (sortOrder === "asc") {
          // sort by "most recent first" i.e. decreasing timestamp
          return (s2.createdAt as Date).getTime() - (s1.createdAt as Date).getTime();
        } else {
          return (s1.createdAt as Date).getTime() - (s2.createdAt as Date).getTime();
        }
      } else if (sortColumn === "questionId") {
        if (sortOrder === "asc") {
          // sort by increasing question id
          return s1.questionId - s2.questionId;
        } else {
          return s2.questionId - s1.questionId;
        }
      } else {
        if (sortOrder === "asc") {
          // sort by increasing alphabetical order of partner name
          return s1.otherUserName.localeCompare(s2.otherUserName);
        } else {
          return s2.otherUserName.localeCompare(s1.otherUserName);
        }
      }
    });
    setSessionHistory(sortedSessionHistory);
  };

  useEffect(() => {
    handleSort();
  }, [sortColumn, sortOrder]);

  const showQuestionDescription = (title: string, description: string) => {
    setMainDialogTitle(title);
    setMainDialogContent(description);
    openMainDialog();
  };

  const viewSubmission = (questionId: number, language: Language | undefined, code: string | undefined) => {
    navigate("/view", { state: { questionId, language, code } });
  };

  return (
    <Box className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <Typography variant="h5" gutterBottom>
          Session History
        </Typography>
        {loading ? (
          <Spinner />
        ) : error ? (
          <Typography align="center" color="error">
            {error}
          </Typography>
        ) : (
          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    onClick={() => {
                      chooseSortByColumn("createdAt");
                    }}
                    className={`${styles.clickable} ` + (sortColumn === "createdAt" ? styles[sortOrder] : "")}
                  >
                    Start time
                  </th>
                  <th
                    onClick={() => {
                      chooseSortByColumn("questionId");
                    }}
                    className={`${styles.clickable} ` + (sortColumn === "questionId" ? styles[sortOrder] : "")}
                  >
                    Question
                  </th>
                  <th
                    onClick={() => {
                      chooseSortByColumn("otherUserName");
                    }}
                    className={`${styles.clickable} ` + (sortColumn === "otherUserName" ? styles[sortOrder] : "")}
                  >
                    Partner
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessionHistory.map((session) => (
                  <tr key={session.roomNumber}>
                    <td>{session.createdAt?.toLocaleString() ?? "Unknown start time"}</td>
                    <td>
                      <Button
                        className={styles.questiontitle}
                        onClick={() => {
                          showQuestionDescription(session.questionTitle, session.questionDescription);
                        }}
                      >
                        {`${session.questionId}. ${session.questionTitle}`}
                      </Button>
                    </td>
                    <td>{session.otherUserName}</td>
                    <td className={styles.complexity}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          viewSubmission(session.questionId, session.language, session.submission);
                        }}
                      >
                        View submission
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </Box>
  );
};

export default History;
