
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // LOGIN
  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const loggedInUser = response.data.user;

    localStorage.setItem(
      "gamebalance_token",
      response.data.token
    );

    localStorage.setItem(
      "gamebalance_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return response.data;
  };

  // REGISTER
  const register = async (formData) => {
    const response = await api.post(
      "/auth/register",
      formData
    );

    return response.data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("gamebalance_token");
    localStorage.removeItem("gamebalance_user");

    setUser(null);
    setLoading(false);
  };

  // LOAD LATEST USER PROFILE
  const loadProfile = async () => {
    const token = localStorage.getItem(
      "gamebalance_token"
    );

    if (!token) {
      localStorage.removeItem("gamebalance_user");
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/profile");

      const updatedUser = response.data.user;

      if (!updatedUser) {
        throw new Error("Profile data missing");
      }

      setUser(updatedUser);

      localStorage.setItem(
        "gamebalance_user",
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.error("Profile loading failed:", error);

      // Only clear the session when authentication
      // is actually rejected.
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("gamebalance_token");
        localStorage.removeItem("gamebalance_user");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // CHECK SESSION ON PAGE LOAD
  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
