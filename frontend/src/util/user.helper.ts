import { User } from "../models/user.model";
import { UserProfile } from "../models/user.model";

export const isAdmin = (user: UserProfile | null): boolean => {
  return user?.role === "admin";
};

export const mapUserResponseToUserProfile = (user: User): UserProfile => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.isAdmin ? "admin" : "user",
    avatar: user.avatar,
    language: user.programmingLanguagePreference,
  };
};

export interface UserValidationErrors {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  avatar?: string | null;
}

export const validateName = (name: string): string | null => {
  if (!name) {
    return "Name is required.";
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "Email is required.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "Please enter a valid email.";
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Password is required.";
  }
  return password.length >= 8 ? null : "Password must be at least 8 characters long";
};

export const validateAvatar = (avatar: string): string | null => {
  if (!avatar) {
    return "Profile photo URL is required.";
  }
  try {
    new URL(avatar);
  } catch (_) {
    return "Please enter a valid URL.";
  }
  return null;
};
