// constants/theme.ts
const tintColorLight = "#2f95dc";

// Official Ibtikar Colors from Brand Guidelines
export const IbtikarColors = {
  primary: "#f6dc55", // Official yellow (#f6dc55 per brand guidelines)
  text: "#000000", // Official black
  textLight: "#FFFFFF", // White for dark backgrounds
  background: "#FFFFFF",
  backgroundDark: "#000000",
  // Additional brand-aligned colors for enhanced design
  primaryLight: "#f9e885", // Lighter yellow for subtle accents
  primaryDark: "#d4c048", // Darker yellow for depth
  grayLight: "#f5f5f5", // Light gray for backgrounds
  grayMedium: "#888888", // Medium gray for secondary text
  grayDark: "#333333", // Dark gray for borders
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