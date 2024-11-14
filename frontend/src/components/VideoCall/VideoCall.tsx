import React, { useContext } from "react";
import { Button, Typography } from "@mui/material";
import Peer, { MediaConnection } from "peerjs";
import "./VideoCall.scss";
import { UserContext } from "../../contexts/UserContext";
import { SessionContext } from "../../contexts/SessionContext";

interface VideoCallProps {
  onClose: () => void;
  setIsVideoCallExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVideoEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  peerInstanceRef: React.MutableRefObject<Peer | undefined>;
  mediaConnectionRef: React.MutableRefObject<MediaConnection | undefined>;
  myVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  isOtherUserStreaming: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  onClose,
  setIsVideoCallExpanded,
  setIsVideoEnabled,
  setIsAudioEnabled,
  mediaConnectionRef,
  myVideoRef,
  remoteVideoRef,
  isOtherUserStreaming,
  isVideoEnabled,
  isAudioEnabled,
}) => {
  const { user } = useContext(UserContext);
  const { otherUserProfile } = useContext(SessionContext);

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleEndCall = () => {
    mediaConnectionRef.current?.close();
    onClose();
  };

  return (
    <div className="video-call-expanded">
      <div className="video-call-header">
        <Typography variant="h6">Video Call</Typography>
        <Button onClick={() => setIsVideoCallExpanded(false)} className="video-call-close-button">
          Collapse
        </Button>
      </div>

      <div className="video-call-container">
        <div className="video-grid">
          <div className="video-box">
            <video ref={myVideoRef} muted autoPlay playsInline className="video-stream" />
            <Typography variant="subtitle2" className="video-label">
              {user?.username} (You)
            </Typography>
          </div>
          <div className="video-box">
            <video ref={remoteVideoRef} autoPlay playsInline className="video-stream" />
            <Typography variant="subtitle2" className="video-label">
              {isOtherUserStreaming ? otherUserProfile?.username : "Waiting for the other user..."}
            </Typography>
          </div>
        </div>

        <div className="video-controls">
          <Button variant="contained" color={isAudioEnabled ? "primary" : "error"} onClick={toggleAudio}>
            {isAudioEnabled ? "Mute" : "Unmute"}
          </Button>
          <Button variant="contained" color={isVideoEnabled ? "primary" : "error"} onClick={toggleVideo}>
            {isVideoEnabled ? "Stop Video" : "Start Video"}
          </Button>
          <Button variant="contained" color="error" onClick={handleEndCall}>
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
