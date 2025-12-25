// constants/theme.ts
const tintColorLight = "#00A3A3"; // Ibtikar Teal

// Official Ibtikar Color Scheme
export const IbtikarColors = {
  // Primary brand colors
  primary: "#F6DE55", // Ibtikar Yellow - Official Logo Background Color
  secondary: "#000000", // Ibtikar Black - Official Logo Text Color
  accent: "#00A3A3", // Ibtikar Teal - Suggested vibrant color

  // Text colors
  text: "#000000", // Primary Text - Black (derived from logo)
  textLight: "#FFFFFF", // White text for dark backgrounds
  textSecondary: "#333333", // Secondary Text - Dark Gray 800

  // Background colors
  background: "#FAFAFA", // Light Gray 100 - Main app background
  surface: "#FFFFFF", // White - Cards, modals, sidebars
  backgroundDark: "#000000", // Black for dark mode

  // Status colors
  success: "#38B000", // Success notifications
  warning: "#F89C1C", // Warning alerts
  error: "#D90000", // Error feedback
  info: "#007BBF", // Information content

  // Neutral colors
  disabled: "#AAAAAA", // Medium Gray 500 - Disabled buttons, placeholders
  placeholder: "#AAAAAA", // Medium Gray 500 - Input placeholders
  border: "#E5E5E5", // Light Gray 300 - Component borders, dividers
  divider: "#E5E5E5", // Light Gray 300 - Separators

  // Legacy support (for gradual migration)
  primaryLight: "#F9E885", // Lighter yellow
  primaryDark: "#D4C048", // Darker yellow
  grayLight: "#FAFAFA", // Same as background
  grayMedium: "#AAAAAA", // Same as disabled
  grayDark: "#333333", // Same as textSecondary
  borderDark: "#E5E5E5", // Same as border
} as const;

// Gradient presets using official colors
export const Gradients = {
  primary: ["#F6DE55", "#00A3A3"], // Yellow -> Teal
  hero: ["#F6DE55", "#00A3A3", "#000000"], // Yellow -> Teal -> Black
  card: ["#FFFFFF", "#FAFAFA"], // White -> Light Gray
  cardDark: ["#000000", "#333333"], // Black -> Dark Gray
} as const;

export const Fonts = {
  rounded: 'System',
  mono: 'Courier',
};

export default {
  light: {
    text: IbtikarColors.text,
    background: IbtikarColors.background,
    tint: tintColorLight,
    tabIconDefault: IbtikarColors.disabled,
    tabIconSelected: IbtikarColors.accent,
    // Ibtikar official colors
    ibtikarPrimary: IbtikarColors.primary,
    ibtikarText: IbtikarColors.text,
  },
  dark: {
    text: IbtikarColors.textLight,
    background: IbtikarColors.backgroundDark,
    tint: tintColorLight,
    tabIconDefault: IbtikarColors.disabled,
    tabIconSelected: tintColorLight,
    // Ibtikar official colors for dark theme
    ibtikarPrimary: IbtikarColors.primary,
    ibtikarText: IbtikarColors.textLight,
  },
};