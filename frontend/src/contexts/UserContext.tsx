import { User } from "../models/user.model";
import UserService from "../services/user.service";
import { UserProfile } from "../models/user.model";
import { createContext, useState, useEffect } from "react";
import { mapUserResponseToUserProfile } from "../util/user.helper";

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const response: User | null = await UserService.refreshToken();
      if (response) {
        setUser(mapUserResponseToUserProfile(response));
      }
    }
    fetchUser();
  }, []);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};
