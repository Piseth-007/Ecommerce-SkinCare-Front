import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("darkMode", String(isDark));
  }, [isDark]);

  return {
    isDark,
    toggleTheme: () => setIsDark((previous) => !previous),
  };
}
