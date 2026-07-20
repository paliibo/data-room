export interface Breadcrumb {
  id: string | null;
  name: string;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

export type Theme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
