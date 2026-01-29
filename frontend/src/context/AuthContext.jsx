import { createContext, useContext, useState, useEffect } from "react";
import { getToken, getUser, clearAuth } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Role checks
  const isAdmin = () => user?.role === "ADMIN";
  const isOrganizer = () => user?.role === "ORGANIZER";
  const isParticipant = () => user?.role === "PARTICIPANT";

  // Dashboard redirect based on role
  const getDashboardPath = () => {
    switch (user?.role) {
      case "ADMIN":
        return "/admin";
      case "ORGANIZER":
        return "/organizer";
      case "PARTICIPANT":
        return "/participant";
      default:
        return "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        updateUser,
        isAdmin,
        isOrganizer,
        isParticipant,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}