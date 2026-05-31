import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { graphqlRequest } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "financy_user";
const TOKEN_KEY = "financy_token";

function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const persist = useCallback((nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, nextToken);
  }, []);

  const persistUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await graphqlRequest<{ login: { user: User; token: string } }>(
      `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user { id name email }
          }
        }
      `,
      { email, password }
    );
    persist(data.login.user, data.login.token);
  }, [persist]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await graphqlRequest<{ register: { user: User; token: string } }>(
      `
        mutation Register($name: String!, $email: String!, $password: String!) {
          register(name: $name, email: $email, password: $password) {
            token
            user { id name email }
          }
        }
      `,
      { name, email, password }
    );
    persist(data.register.user, data.register.token);
  }, [persist]);

  const updateProfile = useCallback(
    async (name: string) => {
      const data = await graphqlRequest<{ updateProfile: User }>(
        `
          mutation UpdateProfile($name: String!) {
            updateProfile(name: $name) {
              id
              name
              email
            }
          }
        `,
        { name }
      );
      persistUser(data.updateProfile);
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, register, updateProfile, logout }),
    [user, token, login, register, updateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
