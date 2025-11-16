// constants/theme.ts
const tintColorLight = "#2f95dc";

// Official Ibtikar Colors from Brand Guidelines
export const IbtikarColors = {
  primary: "#f6de55", // Official yellow
  text: "#000000", // Official black
  textLight: "#FFFFFF", // White for dark backgrounds
  background: "#FFFFFF",
  backgroundDark: "#000000",
} as const;

export const Fonts = {
  rounded: 'System',
  mono: 'Courier',
};

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    // Ibtikar official colors
    ibtikarPrimary: IbtikarColors.primary,
    ibtikarText: IbtikarColors.text,
  },
  dark: {
    text: "#FFFFFF",
    background: "#000000",
    tint: tintColorLight,
    tabIconDefault: "#666666",
    tabIconSelected: tintColorLight,
    // Ibtikar official colors for dark theme
    ibtikarPrimary: IbtikarColors.primary,
    ibtikarText: IbtikarColors.textLight,
  },
};