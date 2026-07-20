import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeState } from "@/hooks/types";
import { applyTheme, storedTheme, systemTheme } from "@/hooks/utils";

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: systemTheme(),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
    }),
    {
      name: "dataroom-theme",
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? systemTheme());
      },
    },
  ),
);

applyTheme(storedTheme() ?? systemTheme());
