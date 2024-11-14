import MDEditor from "@uiw/react-md-editor";
import { ReactElement, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Question, TestCase } from "../../models/question.model";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { autocompletion } from "@codemirror/autocomplete";
import { RangeSetBuilder, Extension } from "@codemirror/state";
import SessionService, { Language } from "../../services/session.service";
import { AxiosError } from "axios";
import { io, Socket } from "socket.io-client";
import { useConfirmationDialog } from "../../contexts/ConfirmationDialogContext";
import { useMainDialog } from "../../contexts/MainDialogContext";
import QuestionService from "../../services/question.service";
import { SessionContext } from "../../contexts/SessionContext";
import { UserContext } from "../../contexts/UserContext";
import { Button, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./CodeContainer.scss";
import HintBox from "../HintBox/HintBox";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

const COLLABORATION_WEBSOCKET_URL = process.env.REACT_APP_COLLABORATION_SERVICE_URL as string;

// Define the CursorWidget
class CursorWidget extends WidgetType {
  color: string;

  constructor(color: string) {
    super();
    this.color = color;
  }

  toDOM() {
    const cursor = document.createElement("span");
    cursor.style.borderLeft = `2px solid ${this.color}`;
    cursor.style.marginLeft = "-1px";
    cursor.style.height = "1em";
    cursor.className = "remote-cursor";
    return cursor;
  }

  ignoreEvent() {
    return true;
  }
}

const userColors = [
  "#FF5733", // Red
  "#33FF57", // Green
  "#3357FF", // Blue
  "#F333FF", // Pink
  "#FF33F3", // Magenta
  "#33FFF3", // Cyan
  "#FFA533", // Orange
  "#A533FF", // Purple
  "#33A5FF", // Light Blue
  "#33FF99", // Light Green
];

const getColorForUser = (sid: string): string => {
  let hash = 0;
  for (let i = 0; i < sid.length; i++) {
    hash = sid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % userColors.length;
  return userColors[index];
};

const languageExtensions: { [key in Language]: Extension[] } = {
  python: [python(), autocompletion()],
  cpp: [cpp(), autocompletion()],
  java: [java(), autocompletion()],
};

// Function to create decorations
const createCursorDecorations = (otherCursors: {
  [sid: string]: { cursor_position: number; color: string };
}): Extension => {
  return EditorView.decorations.of((view) => {
    const builder = new RangeSetBuilder<Decoration>();
    for (const [sid, cursor] of Object.entries(otherCursors)) {
      const { cursor_position, color } = cursor;
      if (typeof cursor_position === "number") {
        // Ensure cursor_position is a number
        const decoration = Decoration.widget({
          widget: new CursorWidget(color),
          side: 0,
        });
        builder.add(cursor_position, cursor_position, decoration);
      } else {
        console.warn(`Invalid cursor_position for sid ${sid}:`, cursor_position);
      }
    }
    return builder.finish();
  });
};

interface CodeContainerProps {
  questionData: Question | null;
  roomNumber: string | undefined;
  givenTestCases: TestCase[];
  setGivenTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  customTestCases: TestCase[];
  setCustomTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
}

const CodeContainer: React.FC<CodeContainerProps> = ({
  questionData,
  roomNumber,
  givenTestCases,
  setGivenTestCases,
  customTestCases,
  setCustomTestCases,
}): ReactElement => {
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();
  const { setConfirmationDialogTitle, setConfirmationDialogContent, setConfirmationCallBack, openConfirmationDialog } =
    useConfirmationDialog();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { questionId, clearSession } = useContext(SessionContext);

  // Use state + ref combination to handle real-time state change + socket events
  const [code, setCode] = useState<string>("# Write your solution here\n");
  const [language, setLanguage] = useState<Language>("python");
  const codeRef = useRef<string>(code);
  const languageRef = useRef<Language>(language);

  const [isHintBoxExpanded, setIsHintBoxExpanded] = useState(false);

  const [joinedRoom, setJoinedRoom] = useState(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const collaborationSocketRef = useRef<Socket | null>(null);

  const setUpCollaborationSocket = () => {
    const token = localStorage.getItem("jwt-token");
    if (!token) {
      console.error("No JWT token found in localStorage.");
      return;
    }

    // Collaboration socket for code editing
    const socket = io(COLLABORATION_WEBSOCKET_URL, {
      extraHeaders: {
        Authorization: `${token}`,
      },
    });
    collaborationSocketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket.io server.");
      socket.emit("join_request", { room_id: roomNumber });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket.io server.");
      clearSession();
      navigate("/");
    });

    socket.on("join_request", (data: any) => {
      console.log("Received join_request data:", data);
      if (data?.user_id && data.user_id === user?.id) {
        // Current user successfully joined a room
        setJoinedRoom(true);
      } else {
        // emit current code and cursor for any new user joining the room
        console.log("emitting");
        socket.emit("language_change", { language: languageRef.current, room_id: roomNumber });
        socket.emit("code_updated", { code: codeRef.current });
        socket.emit("cursor_updated", { cursor_position: lastCursorPosition.current });
      }
    });

    socket.on("language_change", (newLanguage: string) => {
      if (["python", "cpp", "javascript", "java"].includes(newLanguage)) {
        setLanguage(newLanguage as Language);
        if (newLanguage === "cpp") {
          setCode(
            "#include <iostream>\nusing namespace std;\n\nint main() {\n\t// Write your solution here\n\treturn 0;\n}",
          );
        } else if (newLanguage === "java") {
          setCode(
            "public class Main {\n\tpublic static void main(String[] args) {\n\t\t// Write your solution here\n\t}\n}",
          );
        } else {
          setCode("# Write your solution here\n");
        }
      } else {
        console.warn(`Unsupported language received: ${newLanguage}`);
      }
    });

    // Handle real-time code updates
    socket.on("code_updated", (newCode: string) => {
      setCode(newCode);
    });

    // Handle cursor updates
    socket.on("cursor_updated", (userDetails: any) => {
      const { sid, cursor_position } = userDetails;
      if (sid === socket.id) return; // Ignore own cursor

      if (typeof cursor_position !== "number") {
        console.error(`Invalid cursor_position for sid ${sid}:`, cursor_position);
        return;
      }

      setOtherCursors((prev) => ({
        ...prev,
        [sid]: {
          cursor_position,
          color: getColorForUser(sid),
        },
      }));
    });

    // Handle other user submitting code and ending session
    socket.on("code_submitted", (sid: string) => {
      console.log(`Code submitted: ${sid}`);
      setMainDialogTitle("Code submitted");
      setMainDialogContent(
        "Your partner has submitted the code and ended the session. You can view the code in your session history!",
      );
      openMainDialog();
      clearSession();
      navigate("/");
    });

    // Handle socket errors
    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    socket.on("user_left", (data: any) => {
      console.log("User left: ", data);
      if (user && user.id !== data.user_id) {
        setOtherCursors((prev) => {
          const newCursors = { ...prev };
          delete newCursors[data.sid];
          return newCursors;
        });
        setConfirmationDialogTitle("Partner Disconnected");
        setConfirmationDialogContent(
          "Your partner has left the coding session. Would you like to end the session and return to home page?",
        );
        setConfirmationCallBack(() => () => {
          clearSession();
          navigate("/");
        });
        openConfirmationDialog();
      }
    });
  };

  // On load, set up collaboration socket
  useEffect(() => {
    if (user && roomNumber) {
      setUpCollaborationSocket();
    }
    return () => {
      collaborationSocketRef.current?.disconnect();
    };
  }, [user, roomNumber]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // States for cursors
  const lastCursorPosition = useRef<number | null>(null);
  const [otherCursors, setOtherCursors] = useState<{
    [sid: string]: { cursor_position: number; color: string };
  }>({});

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const newLanguage = e.target.value as Language;
    if (["python", "cpp", "javascript", "java"].includes(newLanguage)) {
      setLanguage(newLanguage);
      if (newLanguage === "cpp") {
        setCode(
          "#include <iostream>\nusing namespace std;\n\nint main() {\n\t// Write your solution here\n\treturn 0;\n}",
        );
      } else if (newLanguage === "java") {
        setCode(
          "public class Main {\n\tpublic static void main(String[] args) {\n\t\t// Write your solution here\n\t}\n}",
        );
      } else {
        setCode("# Write your solution here\n");
      }
      if (joinedRoom) {
        collaborationSocketRef.current?.emit("language_change", {
          language: newLanguage,
          room_id: roomNumber,
        });
      }
    } else {
      console.warn(`Attempted to set unsupported language: ${newLanguage}`);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (joinedRoom) {
      // Emit only if joined
      collaborationSocketRef.current?.emit("code_updated", { code: value });
    }
  };

  const handleCursorChange = (viewUpdate: any) => {
    const cursorPosition = viewUpdate.state.selection.main.head;
    if (cursorPosition !== lastCursorPosition.current) {
      lastCursorPosition.current = cursorPosition;
      collaborationSocketRef.current?.emit("cursor_updated", {
        cursor_position: cursorPosition,
      });
    }
  };

  const cursorDecorationsExtension = useMemo(() => {
    return createCursorDecorations(otherCursors);
  }, [otherCursors]);

  // Function to execute the code against all test cases
  const executeCode = async () => {
    if (!questionData) {
      alert("No question data available.");
      return;
    }

    const submittedTestCases = customTestCases.filter((tc) => tc.isSubmitted);

    // Prepare payload for the API
    const payload = {
      lang: languageRef.current,
      code: codeRef.current,
      customTests: submittedTestCases.map((tc) => ({
        input: tc.input,
        output: tc.expectedOutput || null,
      })),
    };

    try {
      setIsExecuting(true);
      const response = await QuestionService.test(questionId, payload);
      setIsExecuting(false);
      // Assuming the API returns an array of actual outputs corresponding to the test cases
      const { outputs } = response;

      if (!Array.isArray(outputs) || outputs.length !== givenTestCases.length + submittedTestCases.length) {
        console.error("Invalid response from code execution API:", response);
        alert("Invalid response from code execution API.");
        return;
      }

      // Update actual outputs in test cases
      const updatedCustomTestCases = customTestCases.map((tc) => {
        const submissionIndex = submittedTestCases.findIndex((stc) => stc.id === tc.id);
        if (submissionIndex !== -1) {
          return {
            ...tc,
            actualOutput: outputs[submissionIndex + givenTestCases.length],
          };
        }
        return tc;
      });
      setCustomTestCases(updatedCustomTestCases);

      const updatedGivenTestCases = givenTestCases.map((tc, i) => {
        return {
          ...tc,
          actualOutput: outputs[i],
        };
      });
      setGivenTestCases(updatedGivenTestCases);
    } catch (error) {
      console.error("Error executing code:", error);
      alert("An error occurred while executing the code.");
    }
  };

  const submitAndEndSession = async () => {
    try {
      setConfirmationDialogTitle("Submit and end session");
      setConfirmationDialogContent(
        "You are about to submit your code and end the session for both you and your partner. Are you sure?",
      );
      setConfirmationCallBack(() => async () => {
        await SessionService.submitSession(user?.id as string, roomNumber!, codeRef.current, languageRef.current);
        collaborationSocketRef.current?.emit("code_submitted");
      });
      openConfirmationDialog();
    } catch (error) {
      setMainDialogTitle("Error");
      setMainDialogContent(
        error instanceof AxiosError && error.response?.data.message
          ? error.response?.data.message
          : "An error occurred while submitting the code.",
      );
      openMainDialog();
    }
  };

  return (
    <div className="CodeContainer">
      <div className="left-side">
        <MDEditor.Markdown source={questionData?.description || ""} className="md-editor" />
      </div>

      <div className="right-side">
        <div className="right-side-container">
          <div className="header">
            <Select
              className="language-select"
              value={language}
              size="small"
              autoWidth
              onChange={handleLanguageChange}
              inputProps={{
                classes: {
                  icon: "language-select-icon",
                },
              }}
            >
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
              <MenuItem value="java">Java</MenuItem>
            </Select>
            <div className="buttons">
              <Button
                variant="outlined"
                size="small"
                className="runcode-button"
                onClick={executeCode}
                disabled={isExecuting}
              >
                Run Code
              </Button>
              <Button
                className="submit-button"
                variant="contained"
                size="small"
                onClick={submitAndEndSession}
                disabled={isExecuting}
              >
                Submit
              </Button>
            </div>
          </div>
          <CodeMirror
            value={code}
            className={"code-editor"}
            height="500px"
            extensions={[...(languageExtensions[language] || []), cursorDecorationsExtension]}
            onChange={handleCodeChange}
            onUpdate={(viewUpdate) => handleCursorChange(viewUpdate)}
            theme={okaidia}
          />
        </div>
      </div>

      {/* Floating AI Hint Button */}
      {!isHintBoxExpanded && (
        <div className="ai-hint-button" onClick={() => setIsHintBoxExpanded(true)}>
          <LightbulbIcon style={{ marginRight: "8px", color: "#FFD700" }} />
          <Typography variant="body1" style={{ color: "#fff" }}>
            AI Hint
          </Typography>
        </div>
      )}

      {isHintBoxExpanded && questionData && (
        <HintBox
          questionId={questionId}
          onClose={() => setIsHintBoxExpanded(false)}
          code={code} // Pass the current code
          language={language} // Pass the current language
        />
      )}
    </div>
  );
};

export default CodeContainer;
