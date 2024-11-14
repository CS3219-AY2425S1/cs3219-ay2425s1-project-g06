import React, { useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Peer, { MediaConnection } from "peerjs";
import "./Communication.scss";
import { UserContext } from "../../contexts/UserContext";

interface Message {
  text: string;
  sender: string;
}

interface PeerVideoConnection {
  peerId: string;
  call: MediaConnection;
  stream: MediaStream;
}

const VideoChat: React.FC = () => {
  const { user } = useContext(UserContext);
  const [myId, setMyId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [peerConnections, setPeerConnections] = useState<PeerVideoConnection[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const myStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user) return;
    socketRef.current = io("http://localhost:3004");
    peerRef.current = new Peer(user?.username as string, {
      host: "localhost",
      port: 9000,
      path: "/peerjs",
    });

    peerRef.current.on("open", () => {
      setMyId(user?.username as string);
    });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("rejoin-room", myId);
    });

    const setupMyVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
        myStreamRef.current = stream;
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    setupMyVideo();

    socketRef.current.on("user-connected", (userId: string) => {
      console.log("User connected:", userId);
      if (myStreamRef.current) {
        connectToNewUser(userId, myStreamRef.current);
      }
    });

    socketRef.current.on("user-reconnected", (userId: string) => {
      console.log("User reconnected:", userId);
      if (myStreamRef.current) {
        connectToNewUser(userId, myStreamRef.current);
      }
    });

    socketRef.current.on("user-disconnected", (userId: string) => {
      console.log("User disconnected:", userId);
      setPeerConnections((prevConnections) => prevConnections.filter((connection) => connection.peerId !== userId));
    });

    socketRef.current.on("rejoin-room", (roomId: string) => {
      setRoomId(roomId);
    });

    socketRef.current.on("receive-message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    peerRef.current.on("call", (call: MediaConnection) => {
      call.answer(myStreamRef.current!);
      call.on("stream", (userVideoStream: MediaStream) => {
        setPeerConnections((prevConnections) => {
          if (!prevConnections.some((conn) => conn.peerId === call.peer)) {
            return [...prevConnections, { peerId: call.peer, call, stream: userVideoStream }];
          }
          return prevConnections;
        });
      });
    });

    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.destroy();
      myStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [user]);

  const connectToNewUser = (userId: string, stream: MediaStream) => {
    const call = peerRef.current!.call(userId, stream);
    console.log("Calling user:", userId);
    if (!call) return;
    call.on("stream", (userVideoStream: MediaStream) => {
      setPeerConnections((prevConnections) => {
        if (!prevConnections.some((conn) => conn.peerId === userId)) {
          return [...prevConnections, { peerId: userId, call, stream: userVideoStream }];
        }
        return prevConnections;
      });
    });
  };

  const joinRoom = (): void => {
    if (roomId && myId) {
      socketRef.current?.emit("join-room", myId, roomId);
    }
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (inputRef.current?.value && roomId) {
      const newMessage: Message = { text: inputRef.current.value, sender: myId };
      socketRef.current?.emit("send-message", newMessage, roomId);
    }
  };

  return (
    <div className="video-chat">
      <h1>Video Chat App</h1>
      <div className="room-join">
        <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Enter Room ID" />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <div className="user-info">
        <h2>Your ID: {myId}</h2>
        <h3>Users in room:</h3>
        <ul>
          {peerConnections.map((peer) => (
            <li key={peer.peerId}>{peer.peerId}</li>
          ))}
        </ul>
      </div>
      <div className="video-grid">
        <div className="video-container">
          <h3>Your Video</h3>
          <video ref={myVideoRef} autoPlay muted playsInline></video>
        </div>
        {peerConnections.map((connection) => (
          <div key={connection.peerId} className="video-container">
            <h3>Peer: {connection.peerId}</h3>
            <video
              autoPlay
              playsInline
              ref={(ref) => {
                if (ref) ref.srcObject = connection.stream;
              }}
            ></video>
          </div>
        ))}
      </div>
      <div className="chat">
        <h3>Chat</h3>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <p key={index}>
              <strong>{msg.sender === myId ? "You" : msg.sender}:</strong> {msg.text}
            </p>
          ))}
        </div>
        <form onSubmit={sendMessage}>
          <input type="text" ref={inputRef} placeholder="Type a message" />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default VideoChat;
