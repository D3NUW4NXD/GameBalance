import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("gamebalance_token", response.data.token);
    setUser(response.data.user);

    return response.data;
  };

  const register = async (formData) => {
    const response = await api.post("/auth/register", formData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("gamebalance_token");
    setUser(null);
  };

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("gamebalance_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get("/auth/profile");
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("gamebalance_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};