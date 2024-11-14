import axios, { AxiosError } from "axios";
import QuestionService from "./question.service";
import UserService from "./user.service";
import { User } from "../models/user.model";

export type Language = "python" | "cpp" | "java";

export interface SessionResponse {
  roomNumber: string;
  questionId: number;
  otherUserId: string;
  isOngoing?: boolean;
  submission?: string;
  language?: Language;
  createdAt?: string;
}

// Data needed for displaying a session
export interface SessionData {
  roomNumber: string;
  questionId: number;
  questionTitle: string;
  questionDescription: string;
  otherUserId: string;
  otherUserName: string;
  isOngoing?: boolean;
  submission?: string;
  language?: Language;
  createdAt?: Date;
}

export default class SessionService {
  private static client = SessionService.createClient();

  private static createClient() {
    const client = axios.create({
      baseURL: process.env.REACT_APP_MATCHING_SERVICE_URL as string,
      headers: {
        "Content-type": "application/json",
      },
    });
    client.interceptors.request.use((config) => {
      const token = localStorage.getItem("jwt-token");
      if (token) {
        config.headers["Authorization"] = token;
      }
      return config;
    });
    return client;
  }

  private static async mapSessionResponseToSessionData(session: SessionResponse): Promise<SessionData> {
    try {
      const question = await QuestionService.getQuestion(session.questionId);
      const user: User | Error = await UserService.getUser(session.otherUserId);

      if (question instanceof Error) {
        throw question;
      }
      if (user instanceof Error) {
        throw user;
      }

      const { title, description } = question;

      return {
        roomNumber: session.roomNumber,
        questionId: session.questionId,
        questionTitle: title ?? "Deleted question",
        questionDescription: description ?? "Description not available",
        otherUserId: session.otherUserId,
        otherUserName: (user.username as string) ?? "Deleted user",
        isOngoing: session.isOngoing,
        submission: session.submission,
        language: session.language,
        createdAt: session.createdAt ? new Date(session.createdAt) : undefined,
      };
    } catch (error) {
      return {
        roomNumber: session.roomNumber,
        questionId: session.questionId,
        questionTitle: "Error fetching question",
        questionDescription: "Error fetching question",
        otherUserId: session.otherUserId,
        otherUserName: "Error fetching user",
        isOngoing: session.isOngoing,
        submission: session.submission,
        language: session.language,
      };
    }
  }

  static async getLatestSession(userId: string): Promise<SessionResponse | null> {
    try {
      const response = await SessionService.client.get("/session", { params: { userId } });
      if (response instanceof AxiosError) {
        throw response;
      }
      return response.data.session;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          console.error("Bad request: ", error.response.data);
        } else if (error.response?.status === 404) {
          console.error("Session not found: ", error.response.data);
        }
      } else {
        console.error("Unexpected error: ", error);
      }
      return null;
    }
  }

  static async getSessionHistory(userId: string, count?: number): Promise<SessionData[]> {
    try {
      const response = await SessionService.client.get("/session-history", { params: { userId, count } });
      if (response instanceof AxiosError) {
        throw response;
      }
      const sessions: SessionResponse[] = response.data.sessions;
      const sessionData = await Promise.all(sessions.map(this.mapSessionResponseToSessionData));
      if (sessionData instanceof AxiosError) {
        throw sessionData;
      }
      return sessionData;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          console.error("Bad request: ", error.response.data);
        } else if (error.response?.status === 404) {
          console.error("Session history not found: ", error.response.data);
        }
      } else {
        console.error("Unexpected error: ", error);
      }
      return [];
    }
  }

  static async leaveSession(userId: string, roomId: string): Promise<void> {
    try {
      const response = await SessionService.client.put("/leave-session", { data: { userId, roomId } });
      if (response instanceof AxiosError) {
        throw response;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error);
        if (error.response?.status === 400) {
          console.error("Bad request: ", error.response.data);
        } else if (error.response?.status === 404) {
          console.error("Session not found: ", error.response.data);
        }
      } else {
        console.error("Unexpected error: ", error);
      }
    }
  }

  static async rejoinSession(userId: string, roomId: string): Promise<SessionResponse> {
    try {
      const response = await SessionService.client.put("/rejoin-session", { data: { userId, roomId } });
      if (response instanceof AxiosError) {
        throw response;
      }
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          console.error("Bad request: ", error.response.data);
        } else if (error.response?.status === 404) {
          console.error("Session not found: ", error.response.data);
        }
      } else {
        console.error("Unexpected error: ", error);
      }
      throw error;
    }
  }

  static async submitSession(userId: string, roomId: string, submission: string, language: Language): Promise<void> {
    try {
      const response = await SessionService.client.put("/submit-session", {
        data: { userId, roomId, submission, language },
      });
      if (response instanceof AxiosError) {
        throw response;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          console.error("Bad request: ", error.response.data);
        } else if (error.response?.status === 404) {
          console.error("Session not found: ", error.response.data);
        }
      } else {
        console.error("Unexpected error: ", error);
      }
      throw error;
    }
  }
}
