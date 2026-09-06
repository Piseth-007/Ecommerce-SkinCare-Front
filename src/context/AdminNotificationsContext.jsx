import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../api/axios";

const AdminNotificationsContext = createContext(null);
const POLL_INTERVAL = 30000;

export function AdminNotificationsProvider({ children }) {
  const [counts, setCounts] = useState({ orders: 0, contacts: 0, reviews: 0 });
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  const fetchCounts = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await api.get("/admin/notifications/counts", {
        signal: controller.signal,
      });
      const data = res.data?.data || res.data;
      if (mountedRef.current) setCounts(data);
    } catch (err) {
      if (err.name !== "CanceledError") return;
    }
  }, []);

  const markViewed = useCallback(
    async (section) => {
      try {
        await api.post(`/admin/notifications/mark-viewed/${section}`);
        fetchCounts();
      } catch {
        return;
      }
    },
    [fetchCounts],
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchCounts();
    const interval = setInterval(fetchCounts, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchCounts();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      controllerRef.current?.abort();
    };
  }, [fetchCounts]);

  return (
    <AdminNotificationsContext.Provider
      value={{ counts, refresh: fetchCounts, markViewed }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx)
    throw new Error(
      "useAdminNotifications must be used within AdminNotificationsProvider",
    );
  return ctx;
}
