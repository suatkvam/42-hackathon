export interface Theme {
  name: string;
  colors: {
    primary: string;
    primaryHover: string;
    background: string;
    backgroundSecondary: string;
    card: string;
    cardHover: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
  };
  gradient: string;
}

export const themes: Record<string, Theme> = {
  default: {
    name: "Orange (Default)",
    colors: {
      primary: "#c96d37",
      primaryHover: "#ff8b3d",
      background: "linear-gradient(180deg, #c96d37, #1f1f1f)",
      backgroundSecondary: "#2d2d2d",
      card: "#ffffff",
      cardHover: "#f7fafc",
      text: "#1a202c",
      textSecondary: "#718096",
      border: "#e2e8f0",
      accent: "#c96d37",
      success: "#48bb78",
      warning: "#ed8936",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #c96d37, #1f1f1f)",
  },
  dark: {
    name: "Dark Mode",
    colors: {
      primary: "#8b5cf6",
      primaryHover: "#7c3aed",
      background: "linear-gradient(180deg, #1a202c, #000000)",
      backgroundSecondary: "#2d3748",
      card: "#2d3748",
      cardHover: "#4a5568",
      text: "#f7fafc",
      textSecondary: "#cbd5e0",
      border: "#4a5568",
      accent: "#8b5cf6",
      success: "#48bb78",
      warning: "#ed8936",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #1a202c, #000000)",
  },
  light: {
    name: "Light Mode",
    colors: {
      primary: "#4299e1",
      primaryHover: "#3182ce",
      background: "linear-gradient(180deg, #ffffff, #edf2f7)",
      backgroundSecondary: "#f7fafc",
      card: "#ffffff",
      cardHover: "#edf2f7",
      text: "#1a202c",
      textSecondary: "#718096",
      border: "#e2e8f0",
      accent: "#4299e1",
      success: "#48bb78",
      warning: "#ed8936",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #ffffff, #edf2f7)",
  },
  orange: {
    name: "Orange Sunset",
    colors: {
      primary: "#ff6b35",
      primaryHover: "#ff8c5a",
      background: "linear-gradient(180deg, #ff6b35, #f7931e, #1f1f1f)",
      backgroundSecondary: "#3d2817",
      card: "#ffffff",
      cardHover: "#fff5f0",
      text: "#1a202c",
      textSecondary: "#718096",
      border: "#ffd7c4",
      accent: "#ff6b35",
      success: "#48bb78",
      warning: "#f7931e",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #ff6b35, #f7931e, #1f1f1f)",
  },
  purple: {
    name: "Purple Dream",
    colors: {
      primary: "#9f7aea",
      primaryHover: "#805ad5",
      background: "linear-gradient(180deg, #9f7aea, #553c9a, #1a202c)",
      backgroundSecondary: "#3d2d5a",
      card: "#ffffff",
      cardHover: "#faf5ff",
      text: "#1a202c",
      textSecondary: "#718096",
      border: "#e9d8fd",
      accent: "#9f7aea",
      success: "#48bb78",
      warning: "#ed8936",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #9f7aea, #553c9a, #1a202c)",
  },
  ocean: {
    name: "Ocean Blue",
    colors: {
      primary: "#0891b2",
      primaryHover: "#0e7490",
      background: "linear-gradient(180deg, #06b6d4, #0891b2, #164e63)",
      backgroundSecondary: "#0f3d4d",
      card: "#ffffff",
      cardHover: "#ecfeff",
      text: "#1a202c",
      textSecondary: "#718096",
      border: "#a5f3fc",
      accent: "#0891b2",
      success: "#48bb78",
      warning: "#ed8936",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #06b6d4, #0891b2, #164e63)",
  },
  forest: {
    name: "Forest Green",
    colors: {
      primary: "#059669",
      primaryHover: "#047857",
      background: "linear-gradient(180deg, #10b981, #059669, #064e3b)",
      backgroundSecondary: "#0f3d2d",
      card: "#ffffff",
      cardHover: "#f0fdf4",
      text: "#1a202c",
      textSecondary: "#718096",
      border: "#a7f3d0",
      accent: "#059669",
      success: "#48bb78",
      warning: "#ed8936",
      danger: "#f56565",
    },
    gradient: "linear-gradient(180deg, #10b981, #059669, #064e3b)",
  },
};

export function getTheme(themeName: string): Theme {
  return themes[themeName] || themes.default;
}

export function getThemeNames(): string[] {
  return Object.keys(themes);
}
