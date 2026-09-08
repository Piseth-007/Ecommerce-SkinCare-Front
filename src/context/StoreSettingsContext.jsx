import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const StoreSettingsContext = createContext(null);

export function StoreSettingsProvider({ children }) {
  const [store, setStore] = useState({});

  useEffect(() => {
    let active = true;

    api
      .get("/settings/store")
      .then((res) => {
        if (active) setStore(res.data?.data || res.data || {});
      })
      .catch(() => {
       
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <StoreSettingsContext.Provider value={store}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext) || {};
}
