import UserService from "../services/user.service";
import { UserProfile } from "../models/user.model";
import { createContext, useState, useEffect, useRef } from "react";
import { mapUserResponseToUserProfile } from "../util/user.helper";
import { Categories, QuestionComplexity } from "../models/question.model";
import { Socket } from "socket.io-client";

export enum SessionState {
  NOT_STARTED,
  TIMEOUT,
  MATCHING,
  PENDING,
  FAIL,
  SUCCESS,
}

interface SessionContextType {
  socket: Socket | null;
  sessionState: SessionState;
  topic: Categories;
  difficulty: QuestionComplexity;
  otherUserId: string | null;
  otherUserProfile: UserProfile | null;
  cumulativeMatchingTime: number; // total milliseconds spent on matching in this connection
  // matchCount: number; // total number of matching attempts in this connection
  lastMatchingStartTime: number; // millisecond timestamp at the start of the last matching
  userAccepted: boolean;
  userDeclined: boolean;
  otherUserAccepted: boolean;
  otherUserDeclined: boolean;

  setSocket: (socket: Socket) => void;
  setSessionState: (state: SessionState) => void;
  setTopic: (topic: Categories) => void;
  setDifficulty: (difficulty: QuestionComplexity) => void;
  setOtherUserId: (otherUserId: string) => void;
  accumulateMatchingTime: () => void;
  // clearMatchCount: () => void;
  // incrementMatchCount: () => void;
  setLastMatchingStartTime: (time: number) => void;
  setUserAccepted: (accepted: boolean) => void;
  setUserDeclined: (declined: boolean) => void;
  setOtherUserAccepted: (accepted: boolean) => void;
  setOtherUserDeclined: (declined: boolean) => void;

  clearSession: () => void;
}

export const SessionContext = createContext<SessionContextType>({
  socket: null,
  sessionState: SessionState.NOT_STARTED,
  topic: Categories.ALGORITHMS,
  difficulty: "Easy",
  otherUserId: null,
  otherUserProfile: null,
  cumulativeMatchingTime: 0,
  // matchCount: 0,
  lastMatchingStartTime: 0,
  userAccepted: false,
  userDeclined: false,
  otherUserAccepted: false,
  otherUserDeclined: false,
  setSocket: () => {},
  setSessionState: () => {},
  setTopic: () => {},
  setDifficulty: () => {},
  setOtherUserId: () => {},
  clearSession: () => {},
  accumulateMatchingTime: () => {},
  // clearMatchCount: () => {},
  // incrementMatchCount: () => {},
  setLastMatchingStartTime: () => {},
  setUserAccepted: () => {},
  setUserDeclined: () => {},
  setOtherUserAccepted: () => {},
  setOtherUserDeclined: () => {},
});

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.NOT_STARTED);
  const [topic, setTopic] = useState<Categories>(Categories.ALGORITHMS);
  const [difficulty, setDifficulty] = useState<QuestionComplexity>("Easy");
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [cumulativeMatchingTime, setCumulativeMatchingTime] = useState<number>(0);
  // const [matchCount, setMatchCount] = useState<number>(0);
  const [lastMatchingStartTime, setLastMatchingStartTime] = useState<number>(Date.now());
  const [userAccepted, setUserAccepted] = useState<boolean>(false);
  const [userDeclined, setUserDeclined] = useState<boolean>(false);
  const [otherUserAccepted, setOtherUserAccepted] = useState<boolean>(false);
  const [otherUserDeclined, setOtherUserDeclined] = useState<boolean>(false);

  // const clearMatchCount = () => {
  //   setMatchCount(0);
  // };

  // const incrementMatchCount = () => {
  //   setMatchCount(matchCount + 1);
  // };

  const lastMatchingStartTimeRef = useRef(lastMatchingStartTime);

  useEffect(() => {
    lastMatchingStartTimeRef.current = lastMatchingStartTime;
  }, [lastMatchingStartTime]);

  const accumulateMatchingTime = () => {
    const currentTime = Date.now();
    // console.log("current:", currentTime);
    // console.log("difference:", currentTime - lastMatchingStartTimeRef.current);

    setCumulativeMatchingTime((prev) => {
      // console.log("cumulative:", prev + currentTime - lastMatchingStartTimeRef.current);
      return prev + currentTime - lastMatchingStartTimeRef.current;
    });
  };

  const clearSession = () => {
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setSessionState(SessionState.NOT_STARTED);
    setTopic(Categories.ALGORITHMS);
    setDifficulty("Easy");
    setOtherUserId(null);
    setOtherUserProfile(null);
    setCumulativeMatchingTime(0);
    // clearMatchCount();
    setLastMatchingStartTime(Date.now());
    setUserAccepted(false);
    setUserDeclined(false);
    setOtherUserAccepted(false);
    setOtherUserDeclined(false);
  };

  useEffect(() => {
    if (otherUserId) {
      UserService.getUser(otherUserId).then((response) => {
        if (response instanceof Error) {
          console.error(response);
        } else {
          setOtherUserProfile(mapUserResponseToUserProfile(response));
        }
      });
    }
  }, [otherUserId]);

  const value = {
    socket,
    sessionState,
    topic,
    difficulty,
    otherUserId,
    otherUserProfile,
    cumulativeMatchingTime,
    // matchCount,
    lastMatchingStartTime,
    userAccepted,
    userDeclined,
    otherUserAccepted,
    otherUserDeclined,
    setSocket,
    setSessionState,
    setTopic,
    setDifficulty,
    setOtherUserId,
    accumulateMatchingTime,
    // clearMatchCount,
    // incrementMatchCount,
    setLastMatchingStartTime,
    setUserAccepted,
    setUserDeclined,
    setOtherUserAccepted,
    setOtherUserDeclined,
    clearSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
