import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseLocalStorageOptions<T> {
  key: string;
  initialValue: T;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T | null;
}

export function useLocalStorage<T>({
  key,
  initialValue,
  serialize = JSON.stringify,
  deserialize,
}: UseLocalStorageOptions<T>): [T, (value: T | ((prev: T) => T)) => void] {
  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      if (deserialize) {
        const parsed = deserialize(raw);
        return parsed ?? initialValue;
      }
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  }, [deserialize, initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(read);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      window.localStorage.setItem(key, serialize(storedValue));
    } catch {
      // Quota exceeded or private mode — fail silently for UX
    }
  }, [key, serialize, storedValue]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => (typeof value === 'function' ? (value as (p: T) => T)(prev) : value));
  }, []);

  return [storedValue, setValue];
}
