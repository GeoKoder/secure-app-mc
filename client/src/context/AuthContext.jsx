
import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check whether a saved token is still valid
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    authAPI
      .getMe()
      .then((response) => {
        const userData = response.data.user;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      })
      .catch(() => {
        // The token may be expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Log in
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // Register
  const register = async (email, password, name) => {
    const response = await authAPI.register({
      email,
      password,
      name,
    });

    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // Log out
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Change the logged-in user's password
  const changePassword = async (currentPassword, newPassword) => {
    const response = await authAPI.changePassword({
      currentPassword,
      newPassword,
    });

    return response.data;
  };

  // Delete the logged-in user's account
  const deleteAccount = async () => {
    const response = await authAPI.deleteAccount();

    // Clear the local session only after successful deletion
    logout();

    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
