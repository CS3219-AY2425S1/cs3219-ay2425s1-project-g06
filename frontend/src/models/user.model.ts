import { SupportedProgrammingLanguages } from "../constants/supported_programming_languages";

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
