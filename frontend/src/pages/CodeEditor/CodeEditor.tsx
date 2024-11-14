import React, { useState, useEffect, useRef, useContext } from "react";
import { Button, Typography } from "@mui/material";
import Chatbox from "../../components/Chatbox/Chatbox";
import VideoCall from "../../components/VideoCall/VideoCall";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ChatIcon from "@mui/icons-material/Chat";
import io, { Socket } from "socket.io-client";
import "./CodeEditor.scss";
import { useNavigate, useParams } from "react-router-dom";
import QuestionService from "../../services/question.service";
import { UserContext } from "../../contexts/UserContext";
import { ChatMessage } from "../../models/communication.model";
import { SessionContext, SessionState } from "../../contexts/SessionContext";
import Peer, { MediaConnection } from "peerjs";
import TestCases from "../../components/TestCases/TestCases";
import { Circle } from "@mui/icons-material";
import { Question, TestCase } from "../../models/question.model";
import QuestionContainer from "../../components/QuestionContainer/QuestionContainer";
import CodeContainer from "../../components/CodeContainer/CodeContainer";

const COMMUNICATION_WEBSOCKET_URL = process.env.REACT_APP_COMMUNICATION_SERVICE_URL as string;
const VIDEO_PEER_SERVICE_PORT = process.env.REACT_APP_VIDEO_SERVICE_PORT;

const CodeEditor: React.FC = () => {
  const { user } = useContext(UserContext);
  const { sessionState, questionId, clearSession, otherUserId, otherUserProfile } = useContext(SessionContext);
  const navigate = useNavigate();

  const { roomNumber } = useParams();

  // State for question and test cases
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [givenTestCases, setGivenTestCases] = useState<TestCase[]>([]);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);

  // States for UI display
  const [isChatboxExpanded, setIsChatboxExpanded] = useState(false);
  const [isVideoCallExpanded, setIsVideoCallExpanded] = useState(false);
  const [hasNewChatMessage, setHasNewChatMessage] = useState(false);
  const [hasNewVideoCall, setHasNewVideoCall] = useState(false);

  // States for communication data display
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]); // For updating state of chatHistory
  const myStream = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // To keep the video playing in the collapsed video call window, necessary to create a duplicate ref
  // Cannot use the same ref for both elements, because ref is recreated in the DOM
  const collapsedRemoteVideoRef = useRef<HTMLVideoElement>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);

  // States for communication connection and data transfer
  const communicationSocketRef = useRef<Socket | null>(null);
  const peerInstanceRef = useRef<Peer>();
  const mediaConnectionRef = useRef<MediaConnection>();
  const [isOtherUserStreaming, setIsOtherUserStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // On load, fetch question data
  useEffect(() => {
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
          isSubmitted: false,
        }));
        setGivenTestCases(fetchedTestCases);
      } catch (error) {
        console.error("Failed to fetch question data:", error);
      }
    };

    if (sessionState !== SessionState.SUCCESS) {
      navigate("/");
      clearSession();
    } else {
      fetchQuestionData();
    }
  }, [questionId, sessionState]);

  // On load, set up communication socket and peer connection
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

    setUpCommunicationSocket(token);
    setUpVideoPeerConnection(token);

    // Cleanup on component unmount
    return () => {
      communicationSocketRef.current?.disconnect();
      myStream.current?.getTracks().forEach((track) => track.stop());
      myStream.current = null;
      mediaConnectionRef.current?.close();
      peerInstanceRef.current?.destroy();
    };
  }, [roomNumber]);

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
      setHasNewChatMessage(true);
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
      setHasNewVideoCall(true);

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
        setHasNewVideoCall(false);
      });
    });
  };

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
      setHasNewVideoCall(false);
    });
  };

  const openVideoCall = async () => {
    setIsVideoCallExpanded(true);
    setHasNewVideoCall(false);
    if (!myStream.current) {
      await getUserMediaStream();
    }
    if (myStream.current) {
      callOtherUserPeer();
    }
  };

  const hangUpVideoCall = () => {
    myStream.current?.getTracks().forEach((track) => track.stop());
    myStream.current = null;
    mediaConnectionRef.current?.close();
    setIsVideoCallExpanded(false);
    setHasNewVideoCall(false);
  };

  const appendToChatHistory = (newMessage: ChatMessage) => {
    setChatHistory([...chatHistoryRef.current, newMessage]);
  };

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

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

  return (
    <div className="app-container">
      <div className="container">
        <QuestionContainer questionData={questionData} />

        <CodeContainer
          questionData={questionData}
          roomNumber={roomNumber}
          givenTestCases={givenTestCases}
          setGivenTestCases={setGivenTestCases}
          customTestCases={customTestCases}
          setCustomTestCases={setCustomTestCases}
        />

        {/* Test Cases Section */}
        <div className="test-cases-section">
          <TestCases
            givenTestCases={givenTestCases}
            customTestCases={customTestCases}
            setCustomTestCases={setCustomTestCases}
          />
        </div>
      </div>

      {/* Floating Chatbox Icon */}
      {!isChatboxExpanded && (
        <div className="chatbox-icon" onClick={() => setIsChatboxExpanded(true)}>
          <ChatIcon style={{ fontSize: "2rem", color: "#fff" }} />
          {hasNewChatMessage && <Circle className="chatbox-icon-alert" color="primary" />}
        </div>
      )}

      {/* Chatbox component */}
      {isChatboxExpanded && (
        <Chatbox
          onClose={() => {
            setIsChatboxExpanded(false);
            setHasNewChatMessage(false);
          }}
          roomNumber={roomNumber}
          communicationSocketRef={communicationSocketRef}
          appendToChatHistory={appendToChatHistory}
          chatHistory={chatHistory}
        />
      )}

      {/* Floating video call icon */}
      {!isVideoCallExpanded && !myStream.current && (
        <div className="video-call-icon" onClick={openVideoCall}>
          <VideoCallIcon style={{ fontSize: "2rem", color: "#fff" }} />
          {hasNewVideoCall && <Circle className="video-call-icon-alert" color="primary" />}
        </div>
      )}

      {/* Collapsed video call component */}
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

      {/* Expanded video call component */}
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
    </div>
  );
};

export default CodeEditor;
