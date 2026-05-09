import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const ACCOUNTS = ["Andre", "Brian", "Claudia", "Elisa"] as const;
export type AccountName = typeof ACCOUNTS[number];

const PASSCODE = "ABCE12";
const SESSION_USER_KEY = "rl_user";
const SESSION_AUTH_KEY = "rl_auth";

interface UserContextValue {
  user: AccountName | null;
  authenticated: boolean;
  login: (user: AccountName, password: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountName | null>(() => {
    const stored = sessionStorage.getItem(SESSION_USER_KEY);
    if (stored && (ACCOUNTS as readonly string[]).includes(stored)) return stored as AccountName;
    return null;
  });
  const [authenticated, setAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_AUTH_KEY) === "true" && !!sessionStorage.getItem(SESSION_USER_KEY)
  );

  // Force logout if user is missing
  useEffect(() => {
    if (authenticated && !user) {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      setAuthenticated(false);
    }
  }, [authenticated, user]);

  const login = useCallback((u: AccountName, password: string) => {
    if (password !== PASSCODE) return false;
    if (!(ACCOUNTS as readonly string[]).includes(u)) return false;
    sessionStorage.setItem(SESSION_USER_KEY, u);
    sessionStorage.setItem(SESSION_AUTH_KEY, "true");
    setUser(u);
    setAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setUser(null);
    setAuthenticated(false);
  }, []);

  return (
    <UserContext.Provider value={{ user, authenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}

export function useCurrentUser(): AccountName {
  const { user } = useUser();
  return user ?? "Brian";
}
