"use client";

import { getSession, Role, User } from "@/api/user";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  sessionToken: string | null;
  role: Role | null;
  userId: number | null;
  dispatcherId: number | null;
  areaId: number | null;
  setUserInfo: (user: User) => void;
  removeUserInfo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [dispatcherId, setDispatcherId] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);

  const setUserInfoState = (user: User) => {
    setSessionToken(user.session_token);
    setRole(user.role);
    setUserId(user.user_id);
    if (user.role === "dispatcher") {
      setDispatcherId(user.dispatcher_id);
      setAreaId(user.area_id);
    }
  };

  const setUserInfo = (user: User) => {
    setIsAuthenticated(true);
    setUserInfoState(user);
  };

  const removeUserInfo = () => {
    setIsAuthenticated(false);
    setSessionToken(null);
    setRole(null);
    setUserId(null);
    setDispatcherId(null);
    setAreaId(null);
  };

  const verifyUser = async () => {
    if (window.location.pathname === "/login") {
      setIsAuthenticated(false);
      return;
    }

    const session = await getSession();
    if (!session) {
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);
    setUserInfoState(session);
  };

  useEffect(() => {
    verifyUser();
  }, []);

  if (isAuthenticated === undefined) {
    return <></>;
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, sessionToken, role, userId, dispatcherId, areaId, setUserInfo, removeUserInfo }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
