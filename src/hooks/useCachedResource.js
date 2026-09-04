import { useCallback, useEffect, useRef, useState } from "react";

const CACHE_VERSION = "v1";

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(`${CACHE_VERSION}:${key}`);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.data)) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(
      `${CACHE_VERSION}:${key}`,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      })
    );
  } catch {
    // Storage can fail in private browsing or when quota is exceeded.
  }
}

export function useCachedResource({
  cacheKey,
  fetcher,
  initialData = [],
}) {
  const cached = useRef(readCache(cacheKey));

  const [data, setData] = useState(
    cached.current ?? initialData
  );

  const [loading, setLoading] = useState(
    cached.current === null
  );

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (silent && data.length > 0) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(false);

      try {
        const result = await fetcher();

        if (!mounted.current) return;

        const nextData = Array.isArray(result) ? result : [];

        setData(nextData);
        writeCache(cacheKey, nextData);
      } catch {
        if (mounted.current) {
          setError(true);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [cacheKey, fetcher, data.length]
  );

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    refresh,
    hasData: data.length > 0,
  };
}