export type ThemeName = "dark-aviation" | "light-enterprise" | "defense-green" | "high-contrast";

export type ThemeOption = {
  name: ThemeName;
  label: string;
  description: string;
  colorScheme: "light" | "dark";
};

export const DEFAULT_THEME: ThemeName = "dark-aviation";
export const THEME_STORAGE_KEY = "antaraal.theme";

export const THEME_OPTIONS: ThemeOption[] = [
  {
    name: "dark-aviation",
    label: "Dark Aviation",
    description: "Low-light cockpit look with amber guidance",
    colorScheme: "dark",
  },
  {
    name: "light-enterprise",
    label: "Light Enterprise",
    description: "Bright workspace with navy highlights",
    colorScheme: "light",
  },
  {
    name: "defense-green",
    label: "Defense Green",
    description: "Operational combat console with olive accents",
    colorScheme: "dark",
  },
  {
    name: "high-contrast",
    label: "High Contrast",
    description: "Accessibility-first, WCAG compliant palette",
    colorScheme: "dark",
  },
];

export const THEME_LOOKUP: Record<ThemeName, ThemeOption> = THEME_OPTIONS.reduce(
  (acc, option) => {
    acc[option.name] = option;
    return acc;
  },
  {} as Record<ThemeName, ThemeOption>,
);

export const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && value in THEME_LOOKUP;

export const applyTheme = (theme: ThemeName) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const option = THEME_LOOKUP[theme];

  root.dataset.theme = theme;
  root.style.setProperty("color-scheme", option.colorScheme);
};
