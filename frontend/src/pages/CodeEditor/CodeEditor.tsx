import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button, Chip, Typography } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Chatbox from "../../components/Chatbox/Chatbox";
import VideoCall from "../../components/VideoCall/VideoCall";
import HintBox from "../../components/HintBox/HintBox";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { autocompletion } from "@codemirror/autocomplete";
import ChatIcon from "@mui/icons-material/Chat";
import io, { Socket } from "socket.io-client";
import "./CodeEditor.scss";
import { useNavigate, useParams } from "react-router-dom";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import { RangeSetBuilder, Extension } from "@codemirror/state";
import QuestionService from "../../services/question.service";
import { UserContext } from "../../contexts/UserContext";
import { ChatMessage } from "../../models/communication.model";
import { SessionContext, SessionState } from "../../contexts/SessionContext";
import { useConfirmationDialog } from "../../contexts/ConfirmationDialogContext";
import Peer, { MediaConnection } from "peerjs";
import TestCases from "../../components/TestCases/TestCases";

const COMMUNICATION_WEBSOCKET_URL = process.env.REACT_APP_COMMUNICATION_SERVICE_URL as string;
const COLLABORATION_WEBSOCKET_URL = process.env.REACT_APP_COLLABORATION_SERVICE_URL as string;
const VIDEO_PEER_SERVICE_PORT = process.env.REACT_APP_VIDEO_SERVICE_PORT;

// Define Language Type
type Language = "python" | "cpp" | "java";

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

interface QuestionData {
  questionId: Number;
  title: string;
  description: string;
  categories: string[];
  complexity: "Easy" | "Medium" | "Hard";
  link: string;
  testCases: {
    input: string;
    output: string;
  }[];
}

interface TestCase {
  id: string; // Unique identifier
  number: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isDefault: boolean;
  isSubmitted?: boolean;
}

const CodeEditor: React.FC = () => {
  const { user } = useContext(UserContext);
  const { sessionState, questionId, clearSession, otherUserId, otherUserProfile } = useContext(SessionContext);
  const { setConfirmationDialogTitle, setConfirmationDialogContent, setConfirmationCallBack, openConfirmationDialog } =
    useConfirmationDialog();
  const navigate = useNavigate();

  const [questionData, setQuestionData] = useState<QuestionData | null>(null);

  const [code, setCode] = useState<string>("# Write your solution here\n");
  const [language, setLanguage] = useState<Language>("python");

  const { roomNumber } = useParams();
  const [joinedRoom, setJoinedRoom] = useState(false); // New state
  const [isHintBoxExpanded, setIsHintBoxExpanded] = useState(false); // New state
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [isChatboxExpanded, setIsChatboxExpanded] = useState(false);
  const [isVideoCallExpanded, setIsVideoCallExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]); // For updating state of chatHistory

  const myStream = useRef<MediaStream | null>(null);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // To keep the video playing in the collapsed video call window, necessary to create a duplicate ref
  // Cannot use the same ref for both elements, because ref is recreated in the DOM
  const collapsedRemoteVideoRef = useRef<HTMLVideoElement>(null);

  const myVideoRef = useRef<HTMLVideoElement>(null);

  const collaborationSocketRef = useRef<Socket | null>(null);
  const communicationSocketRef = useRef<Socket | null>(null);
  const peerInstanceRef = useRef<Peer>();
  const mediaConnectionRef = useRef<MediaConnection>();
  const [isOtherUserStreaming, setIsOtherUserStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const lastCursorPosition = useRef<number | null>(null);
  const [otherCursors, setOtherCursors] = useState<{
    [sid: string]: { cursor_position: number; color: string };
  }>({});

  const languageExtensions: { [key in Language]: Extension[] } = {
    python: [python(), autocompletion()],
    cpp: [cpp(), autocompletion()],
    java: [java(), autocompletion()],
  };

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

  useEffect(() => {
    if (sessionState !== SessionState.SUCCESS) {
      navigate("/");
      clearSession();
      return;
    }

    const fetchQuestionData = async () => {
      try {
        const response = await QuestionService.getQuestion(questionId);
        setQuestionData(response);
        // Initialize test cases from fetched data
        const fetchedTestCases: TestCase[] = response.testCases.map((tc, index) => ({
          id: `default-${index + 1}-${Date.now()}`, // Unique ID
          number: index + 1,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: "",
          isDefault: true,
          isSubmitted: false,
        }));
        setTestCases(fetchedTestCases);
      } catch (error) {
        console.error("Failed to fetch question data:", error);
      }
    };

    fetchQuestionData();
  }, [questionId, sessionState, navigate, clearSession]);

  const appendToChatHistory = (newMessage: ChatMessage) => {
    setChatHistory([...chatHistoryRef.current, newMessage]);
  };

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  const clearSocketsAndPeer = () => {
    if (collaborationSocketRef.current) {
      collaborationSocketRef.current.disconnect();
      console.log("Disconnected from collaboration websocket server.");
    }
    if (communicationSocketRef.current) {
      communicationSocketRef.current.disconnect();
      console.log("Disconnected from communication websocket server.");
    }
    myStream.current?.getTracks().forEach((track) => track.stop());
    myStream.current = null;
    mediaConnectionRef.current?.close();
    peerInstanceRef.current?.destroy();
  };

  const chooseLeaveSession = () => {
    setConfirmationDialogTitle("Leave Session");
    setConfirmationDialogContent("Are you sure you want to leave the session?");
    setConfirmationCallBack(() => () => {
      clearSocketsAndPeer();
      clearSession();
      navigate("/");
    });
    openConfirmationDialog();
  };

  const setUpCollaborationSocket = (token: string) => {
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

    socket.on("join_request", (data: any) => {
      console.log("Received join_request data:", data);
      if (data.code) {
        setCode(data.code);
      }
      setJoinedRoom(true); // User has successfully joined a room
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

    // Handle user disconnection to remove their cursor
    socket.on("user_disconnected", (sid: string) => {
      console.log(`User disconnected: ${sid}`);
      setOtherCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[sid];
        return newCursors;
      });
    });

    // Handle socket errors
    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    socket.on("user_left", (uid: string) => {
      if (user && uid !== user.id) {
        setConfirmationDialogTitle("Partner Disconnected");
        setConfirmationDialogContent(
          "Your partner has left the coding session. Would you like to end the session and return to home page?",
        );
        setConfirmationCallBack(() => () => {
          clearSocketsAndPeer();
          clearSession();
          navigate("/");
        });
        openConfirmationDialog();
      }
    });
  };

  const setUpCommunicationSocket = (token: string) => {
    // Communication socket for chat
    if (!user) {
      console.error("No user found when setting up communication socket.");
      return;
    }
    const chatSocket = io(COMMUNICATION_WEBSOCKET_URL, {
      extraHeaders: {
        Authorization: `${token}`,
      },
    });
    communicationSocketRef.current = chatSocket;

    chatSocket.on("connect", () => {
      chatSocket.emit("join-room", user?.id as string, roomNumber);
    });

    chatSocket.on("receive-message", (message: string, senderId: string, senderName: string, timeStamp: number) => {
      if (senderId === user.id) return;
      const newMessage: ChatMessage = {
        senderId: senderId,
        senderName: senderName,
        message: message,
        timestamp: new Date(timeStamp),
      };
      appendToChatHistory(newMessage);
    });

    communicationSocketRef.current?.on("user-disconnected", (newUserId: string) => {
      if (newUserId === user.id) return;
      if (mediaConnectionRef.current) {
        mediaConnectionRef.current.close();
      }
    });
  };

  const setUpVideoPeerConnection = (token: string) => {
    if (!user) {
      console.error("No user found when setting up peer connection.");
      return;
    }

    // Peer connection for video call
    const peer = new Peer(user.id as string, {
      host: "localhost",
      port: Number(VIDEO_PEER_SERVICE_PORT),
      path: "/peerjs",
      token: token,
    });

    peerInstanceRef.current = peer;

    peer.on("open", (id) => {
      console.log(`User ${user.username} opened peer with ID: ${id}`);
    });

    peer.on("call", (call) => {
      console.log("Received call from other user.");
      call.answer(myStream.current!);
      mediaConnectionRef.current?.close();
      mediaConnectionRef.current = call;

      call.on("stream", (remoteStream) => {
        console.log("Streaming video from caller.");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        if (collapsedRemoteVideoRef.current) {
          collapsedRemoteVideoRef.current.srcObject = remoteStream;
        }
        setIsOtherUserStreaming(true);
      });

      call.on("close", () => {
        console.log("Call is hung up.");
        setIsOtherUserStreaming(false);
      });
    });
  };

  useEffect(() => {
    // set up websockets
    if (!roomNumber) {
      return;
    }

    const token = localStorage.getItem("jwt-token");
    if (!token) {
      console.error("No JWT token found in localStorage.");
      return;
    }

    setUpCollaborationSocket(token);
    setUpCommunicationSocket(token);
    setUpVideoPeerConnection(token);

    // Cleanup on component unmount
    return () => {
      clearSocketsAndPeer();
    };
  }, [roomNumber]);

  const getUserMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioEnabled;
      });
      myStream.current = stream;

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to initialize call:", err);
    }
  };

  const callOtherUserPeer = () => {
    // connect to the peer identified by the other user's ID
    if (!otherUserId) {
      console.error("Other user ID not found in session context.");
      return;
    }
    console.log(`User ${user?.username} calling the other user with peer ID ${otherUserId}`);
    mediaConnectionRef.current?.close();
    const call = peerInstanceRef.current!.call(otherUserId, myStream.current!);
    mediaConnectionRef.current = call;

    call.on("stream", (remoteStream) => {
      if (!remoteStream) {
        console.log("Callee is not ready to stream video.");
        call.close();
      }
      console.log("Streaming video from callee.");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (collapsedRemoteVideoRef.current) {
        collapsedRemoteVideoRef.current.srcObject = remoteStream;
      }
      setIsOtherUserStreaming(true);
    });

    call.on("close", () => {
      console.log("Call is hung up.");
      setIsOtherUserStreaming(false);
    });
  };

  const openVideoCall = async () => {
    setIsVideoCallExpanded(true);
    if (!myStream.current) {
      await getUserMediaStream();
    }
    if (myStream.current) {
      callOtherUserPeer();
    }
  };

  useEffect(() => {
    myStream.current?.getVideoTracks().forEach((track) => {
      track.enabled = isVideoEnabled;
    });
  }, [isVideoEnabled]);

  useEffect(() => {
    myStream.current?.getAudioTracks().forEach((track) => {
      track.enabled = isAudioEnabled;
    });
  }, [isAudioEnabled]);

  const hangUpVideoCall = () => {
    myStream.current?.getTracks().forEach((track) => track.stop());
    myStream.current = null;
    mediaConnectionRef.current?.close();
    setIsVideoCallExpanded(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

  const handleHangUp = () => {
    setIsVideoCallExpanded(false);
  };

  const cursorDecorationsExtension = useMemo(() => {
    return createCursorDecorations(otherCursors);
  }, [otherCursors]);

  // State for all test cases
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const addTestCase = () => {
    if (testCases.length >= 5) {
      // Adjust the limit as needed
      alert("You can only add up to 5 test cases.");
      return;
    }
    const newTestCase: TestCase = {
      id: `user-${Date.now()}`,
      number: testCases.length + 1,
      input: "",
      expectedOutput: "",
      actualOutput: "",
      isDefault: false,
      isSubmitted: false,
    };
    setTestCases([...testCases, newTestCase]);
  };

  // Function to update a test case field
  const updateTestCase = (id: string, field: "input" | "expectedOutput", value: string) => {
    const updatedTestCases = testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc));
    setTestCases(updatedTestCases);
  };

  // Function to submit a test case (mark as submitted)
  const submitTestCase = (id: string) => {
    const updatedTestCases = testCases.map((tc) => (tc.id === id ? { ...tc, isSubmitted: true } : tc));
    setTestCases(updatedTestCases);
  };

  // Function to delete a test case
  const deleteTestCase = (id: string) => {
    const updatedTestCases = testCases.filter((tc) => tc.id !== id);
    // Re-number the remaining test cases
    const renumberedTestCases = updatedTestCases.map((tc, index) => ({
      ...tc,
      number: index + 1,
    }));
    setTestCases(renumberedTestCases);
  };

  // Function to execute the code against all test cases
  const executeCode = async () => {
    if (!questionData) {
      alert("No question data available.");
      return;
    }

    const submittedTestCases = testCases.filter((tc) => tc.isSubmitted || tc.isDefault);

    if (submittedTestCases.length === 0) {
      alert("No test cases to execute.");
      return;
    }

    // Prepare payload for the API
    const payload = {
      language: language,
      code: code,
      testCases: submittedTestCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
    };

    try {
      // Replace '/api/execute' with your actual API endpoint
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Code execution failed:", errorData);
        alert(`Code execution failed: ${errorData.message || "Unknown error"}`);
        return;
      }

      const result = await response.json();

      // Assuming the API returns an array of actual outputs corresponding to the test cases
      const { actualOutputs } = result;

      if (!Array.isArray(actualOutputs) || actualOutputs.length !== submittedTestCases.length) {
        console.error("Invalid response from code execution API:", result);
        alert("Invalid response from code execution API.");
        return;
      }

      // Update actual outputs in test cases
      const updatedTestCases = testCases.map((tc) => {
        const submissionIndex = submittedTestCases.findIndex((stc) => stc.id === tc.id);
        if (submissionIndex !== -1) {
          return {
            ...tc,
            actualOutput: actualOutputs[submissionIndex],
          };
        }
        return tc;
      });

      setTestCases(updatedTestCases);
    } catch (error) {
      console.error("Error executing code:", error);
      alert("An error occurred while executing the code.");
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="container">
        <div className="top-section">
          <Typography variant="h3" className="question-title">
            {questionData?.title}
          </Typography>

          <div className="details">
            <Chip label={`Difficulty: ${questionData?.complexity}`} className="detail-chip light-grey-chip" />
            <Chip label={`Topic: ${questionData?.categories.join(", ")}`} className="detail-chip light-grey-chip" />
            <Chip
              label={`URL: ${questionData?.link}`}
              className="detail-chip light-grey-chip"
              clickable
              onClick={() => window.open(questionData?.link, "_blank")}
              icon={<OpenInNewIcon style={{ color: "#caff33" }} />}
            />
          </div>
        </div>

        <div className="editors">
          <div className="left-side">
            <MDEditor.Markdown source={questionData?.description || ""} className="md-editor" />
          </div>

          <div className="right-side">
            <div className="header">
              <select className="language-select" onChange={handleLanguageChange} value={language}>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              <Button variant="contained" size="small" className="submit-button" onClick={executeCode}>
                Run Code
              </Button>
            </div>
            <CodeMirror
              value={code}
              height="500px"
              style={{ fontSize: "18px" }}
              extensions={[...(languageExtensions[language] || []), cursorDecorationsExtension]}
              onChange={handleCodeChange}
              onUpdate={(viewUpdate) => handleCursorChange(viewUpdate)}
              theme={okaidia}
            />
          </div>
        </div>

        {/* Test Cases Section */}
        <div className="test-cases-section">
          <TestCases
            testCases={testCases}
            addTestCase={addTestCase}
            updateTestCase={updateTestCase}
            submitTestCase={submitTestCase}
            deleteTestCase={deleteTestCase}
          />
        </div>

        <div className="buttons">
          <Button variant="contained" color="error" className="buttons-leave" onClick={chooseLeaveSession}>
            Leave Session
          </Button>
        </div>
      </div>

      {/* Floating Chatbox Icon */}
      {!isChatboxExpanded && (
        <div className="chatbox-icon" onClick={() => setIsChatboxExpanded(true)}>
          <ChatIcon style={{ fontSize: "2rem", color: "#fff" }} />
        </div>
      )}

      {isChatboxExpanded && (
        <Chatbox
          onClose={() => setIsChatboxExpanded(false)}
          roomNumber={roomNumber}
          communicationSocketRef={communicationSocketRef}
          appendToChatHistory={appendToChatHistory}
          chatHistory={chatHistory}
        />
      )}

      {!isVideoCallExpanded && !myStream.current && (
        <div className="video-call-icon" onClick={openVideoCall}>
          <VideoCallIcon style={{ fontSize: "2rem", color: "#fff" }} />
        </div>
      )}

      <div
        className="video-call-collapsed"
        onClick={openVideoCall}
        style={{ display: !isVideoCallExpanded && myStream.current ? "block" : "none" }}
      >
        <div className="video-box">
          <video ref={collapsedRemoteVideoRef} autoPlay playsInline className="video-stream" />
          <Typography variant="subtitle2" className="video-label">
            {isOtherUserStreaming ? otherUserProfile?.username : "Waiting for the other user..."}
          </Typography>
        </div>
      </div>

      <div style={{ display: isVideoCallExpanded ? "block" : "none" }}>
        <VideoCall
          onClose={hangUpVideoCall}
          setIsVideoCallExpanded={setIsVideoCallExpanded}
          setIsVideoEnabled={setIsVideoEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          peerInstanceRef={peerInstanceRef}
          mediaConnectionRef={mediaConnectionRef}
          myVideoRef={myVideoRef}
          remoteVideoRef={remoteVideoRef}
          isOtherUserStreaming={isOtherUserStreaming}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
        />
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

      {/* HintBox Component */}
      {isHintBoxExpanded && questionData && (
        <HintBox questionId={questionId} onClose={() => setIsHintBoxExpanded(false)} />
      )}

      <Footer />
    </div>
  );
};

export default CodeEditor;
