import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "../api/axios";
import { useAuth } from "./useAuth";

export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const getFavoriteArray = (response) => {
    const data = response?.data?.data ?? response?.data;

    return Array.isArray(data) ? data : [];
  };

  const loadFavorites = useCallback(async () => {
    // User is logged out
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await api.get("/favorites");

      setFavorites(getFavoriteArray(res));
    } catch (error) {
      console.error("Failed to load favorites:", error);

      // Keep state predictable
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorited = useCallback(
    (productId) => {
      if (!productId) return false;

      return favorites.some(
        (favorite) => Number(favorite.product_id) === Number(productId),
      );
    },
    [favorites],
  );

  // --------------------------------------------------
  // Toggle favorite
  // --------------------------------------------------

  const toggleFavorite = useCallback(
    async (productId) => {
      if (!user) {
        throw new Error("AUTH_REQUIRED");
      }

      if (!productId) {
        throw new Error("PRODUCT_ID_REQUIRED");
      }

      try {
        if (isFavorited(productId)) {
          // Remove favorite
          const res = await api.delete(`/favorites/${productId}`);

          setFavorites(getFavoriteArray(res));
        } else {
          // Add favorite
          const res = await api.post("/favorites", {
            product_id: productId,
          });

          setFavorites(getFavoriteArray(res));
        }
      } catch (error) {
        console.error("Failed to toggle favorite:", error);

        // Do not modify favorites if request failed
        throw error;
      }
    },
    [user, isFavorited],
  );

  // --------------------------------------------------
  // Context value
  // --------------------------------------------------

  const value = useMemo(
    () => ({
      favorites,
      itemCount: favorites.length,
      loading,
      isFavorited,
      toggleFavorite,
      reload: loadFavorites,
    }),
    [favorites, loading, isFavorited, toggleFavorite, loadFavorites],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
