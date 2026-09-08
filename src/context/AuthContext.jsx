import { createContext, useState, useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (idToken) => {
    const res = await api.post("/auth/google", { id_token: idToken });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post("/register", data);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post("/logout");
    localStorage.removeItem("token");
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const res = await api.post("/forgot-password", { email });
    return res.data;
  };

  const resetPassword = async (data) => {
    const res = await api.post("/reset-password", data);
    return res.data;
  };


  const updateProfile = async (data) => {
    const res = await api.put("/profile", data);
    setUser(res.data);
    return res.data;
  };


  const updatePassword = async (data) => {
    const res = await api.put("/profile/password", data);
    return res.data;
  };


  const updateProfileImage = async (file) => {
    const formData = new FormData();
    formData.append("profile_image", file);

    const res = await api.post("/profile/image", formData);

    setUser((prev) => ({ ...prev, profile_image: res.data.profile_image }));
    return res.data;
  };

  const removeProfileImage = async () => {
    const res = await api.delete("/profile/image");
    setUser((prev) => ({ ...prev, profile_image: null }));
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        updatePassword,
        updateProfileImage,
        removeProfileImage,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}