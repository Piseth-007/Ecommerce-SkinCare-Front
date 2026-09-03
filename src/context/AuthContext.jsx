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

  // Updates name/email/phone. Backend returns the fresh user object,
  // so we push it straight into context — no need to refetch /me.
  const updateProfile = async (data) => {
    const res = await api.put("/profile", data);
    setUser(res.data);
    return res.data;
  };

  // Requires current_password, password, password_confirmation.
  // Does not touch context state — nothing about the user object changes.
  const updatePassword = async (data) => {
    const res = await api.put("/profile/password", data);
    return res.data;
  };

  // file: a File object from an <input type="file"> — sent as multipart/form-data.
  // Backend only returns { profile_image }, so we merge it into the existing user.
  const updateProfileImage = async (file) => {
    const formData = new FormData();
    formData.append("profile_image", file);
    const res = await api.post("/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser((prev) => ({ ...prev, profile_image: res.data.profile_image }));
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        updatePassword,
        updateProfileImage,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
