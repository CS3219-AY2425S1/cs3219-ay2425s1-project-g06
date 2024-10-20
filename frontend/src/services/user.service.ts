import axios, { AxiosError, AxiosInstance } from "axios";
import { User } from "../models/user.model";
import { JWT_TOKEN_KEY } from "../util/constants";
import { SupportedProgrammingLanguages } from "../constants/supported_programming_languages";

const UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred.";

export default class UserService {
  private static client: AxiosInstance = axios.create({
    baseURL: process.env.REACT_APP_USER_SERVICE_URL as string,
    headers: {
      "Content-type": "application/json",
      authorization: localStorage.getItem(JWT_TOKEN_KEY),
    },
  });

  /**
   * Creates a new axios client, for updating token when needed
   */
  private static createAxiosClient() {
    UserService.client = axios.create({
      baseURL: process.env.REACT_APP_USER_SERVICE_URL as string,
      headers: {
        "Content-type": "application/json",
        authorization: localStorage.getItem(JWT_TOKEN_KEY),
      },
    });
  }

  static async login(email: string, password: string): Promise<User | Error> {
    try {
      const response = await UserService.client.post("/auth/login", { email, password });
      const token = response.data.data.accessToken as string;
      localStorage.setItem(JWT_TOKEN_KEY, `Bearer ${token}`);
      this.createAxiosClient();
      return response.data.data;
    } catch (error: any) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          return new Error("Invalid email or password, please try again.");
        }
        return new Error(error.response?.data.message ?? UNEXPECTED_ERROR_MESSAGE);
      }
      return error;
    }
  }

  static async signup(email: string, password: string, username: string): Promise<User | Error> {
    try {
      const response = await UserService.client.post("/users/", { username, email, password });
      return response.data;
    } catch (error: any) {
      if (error instanceof AxiosError) {
        return new Error(error.response?.data.message ?? UNEXPECTED_ERROR_MESSAGE);
      }
      return error;
    }
  }

  static async refreshToken(): Promise<User | null> {
    try {
      const response = await UserService.client.get("/auth/verify-token");
      return response.data.data;
    } catch (error: any) {
      return null;
    }
  }

  static async getUser(id: string): Promise<User | Error> {
    try {
      const response = await UserService.client.get(`/users/${id}`);
      return response.data.data;
    } catch (error: any) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return new Error("User not found.");
        }
        return new Error(error.response?.data.message ?? UNEXPECTED_ERROR_MESSAGE);
      }
      return error;
    }
  }

  static async updateAccount(
    id: string,
    username: string,
    email: string,
    password: string | null,
    avatar: string,
    programmingLanguagePreference: SupportedProgrammingLanguages,
  ): Promise<User | Error> {
    try {
      const response = await UserService.client.patch(`/users/${id}`, {
        username,
        email,
        password,
        avatar,
        programmingLanguagePreference,
      });
      return response.data.data;
    } catch (error: any) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          return new Error("Authentication failed, please log in and try again.");
        }
        return new Error(error.response?.data.message ?? UNEXPECTED_ERROR_MESSAGE);
      }
      return error;
    }
  }

  static async deleteAccount(id: String): Promise<void | Error> {
    try {
      await UserService.client.delete(`/users/${id}`);
    } catch (error: any) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return new Error("User not found, please refresh the page and try again.");
        }
        return new Error(error.response?.data.message ?? UNEXPECTED_ERROR_MESSAGE);
      }
      return error;
    }
  }
}
