import { useEffect } from "react";
import { useThemeStore, type ThemePreference } from "@/stores/theme.store";

function resolveTheme(theme: ThemePreference) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function useTheme() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return { theme, setTheme };
}
