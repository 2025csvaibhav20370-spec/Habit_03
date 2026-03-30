import { useLocalStorage } from "./use-local-storage";

export interface User {
  username: string;
}

export function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>("prod_tracker_user", null);
  const [usersDb, setUsersDb] = useLocalStorage<Record<string, string>>("prod_tracker_db", {});

  const login = (username: string, password?: string) => {
    // Fake login: if user exists in our local DB, allow it. If not, error.
    if (usersDb[username]) {
       // Ignore password check for this prototype, or enforce if needed
       setUser({ username });
       return true;
    }
    return false;
  };

  const register = (username: string, password?: string) => {
    if (usersDb[username]) {
      return false; // User exists
    }
    setUsersDb({ ...usersDb, [username]: password || "pass" });
    setUser({ username });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return { user, login, register, logout, isAuthenticated: !!user };
}
