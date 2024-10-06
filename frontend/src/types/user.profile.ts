import { SupportedProgrammingLanguages } from "../constants/supported_programming_languages";

export interface UserProfile {
  id: String;
  username: String;
  email: String;
  avatar: String;
  role: String;
  language: SupportedProgrammingLanguages;
}
