import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { applyTheme, DEFAULT_THEME, isThemeName, THEME_OPTIONS, THEME_STORAGE_KEY, type ThemeName } from "@/theme/theme-config";

export type ThemeContextValue = {
  theme: ThemeName;
  themes: typeof THEME_OPTIONS;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const resolveInitialTheme = (): ThemeName => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && isThemeName(stored)) {
    applyTheme(stored);
    return stored;
  }

  applyTheme(DEFAULT_THEME);
  return DEFAULT_THEME;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(resolveInitialTheme);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState((current) => {
      if (current === nextTheme) {
        return current;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }

      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themes: THEME_OPTIONS, setTheme }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export type { ThemeName } from "@/theme/theme-config";
