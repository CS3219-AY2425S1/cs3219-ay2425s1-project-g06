import React, { useState, useEffect, useRef, useContext } from "react";
import { Typography, Button } from "@mui/material";
import "./Chatbox.scss";
import { UserContext } from "../../contexts/UserContext";
import { Socket } from "socket.io-client";
import { ChatMessage } from "../../models/communication.model";

interface ChatboxProps {
  onClose: () => void;
  roomNumber: string | undefined;
  communicationSocketRef: React.MutableRefObject<Socket | null>;
  appendToChatHistory: (message: ChatMessage) => void;
  chatHistory: ChatMessage[];
}

const Chatbox: React.FC<ChatboxProps> = ({
  onClose,
  roomNumber,
  communicationSocketRef,
  appendToChatHistory,
  chatHistory,
}) => {
  const { user } = useContext(UserContext);

  const [messageInput, setMessageInput] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll down
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const sendMessage = () => {
    if (messageInput.trim() === "") return;

    if (!roomNumber || !user) return;

    communicationSocketRef.current?.emit("send-message", messageInput, user.id, user.username, roomNumber);

    const newMessage: ChatMessage = {
      senderName: user.username as string,
      senderId: user.id as string,
      message: messageInput,
      timestamp: new Date(),
    };
    appendToChatHistory(newMessage);
    setMessageInput("");
  };

  return (
    <div className="chatbox-expanded">
      <div className="chatbox-header">
        <Typography variant="h6">Chat</Typography>
        <Button onClick={onClose} className="chat-close-button">
          Close
        </Button>
      </div>
      <div className="chatbox-container">
        <div className="chat-messages">
          {chatHistory.map((chat, index) => {
            const isOutgoing = chat.senderId === user?.id;
            return (
              <div key={index} className={`chat-message ${isOutgoing ? "chat-message-right" : "chat-message-left"}`}>
                <div className="message-sender">{chat.senderName}</div>
                <div className="message-content">{chat.message}</div>
                <div className="message-timestamp">{chat.timestamp.toLocaleTimeString()}</div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            className="chat-input-field"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <Button variant="contained" size="small" className="chat-send-button" onClick={sendMessage}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
