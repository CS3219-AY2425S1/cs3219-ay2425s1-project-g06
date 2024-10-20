import { SupportedProgrammingLanguages } from "../constants/supported_programming_languages";

// user model for response from backend
export interface User {
  id: String;
  username: String;
  email: String;
  name: String;
  password: String;
  createdAt: Date;
  isAdmin: Boolean;
  avatar: String;
  programmingLanguagePreference: SupportedProgrammingLanguages;
}

// for frontend display of user information
export interface UserProfile {
  id: String;
  username: String;
  email: String;
  avatar: String;
  role: String;
  language: SupportedProgrammingLanguages;
}
