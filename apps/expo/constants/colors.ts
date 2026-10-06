export type ThemeColors = {
  navy: string;
  navyLight: string;
  navyDark: string;
  teal: string;
  tealLight: string;
  tealDark: string;
  tealSoft: string;
  tealMuted: string;
  gold: string;
  goldLight: string;
  coral: string;
  mint: string;
  white: string;
  offWhite: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  black: string;
  red: string;
  green: string;
  greenLight: string;
  orange: string;
  orangeLight: string;
  overlay: string;
  overlayLight: string;
  cardShadow: string;
  backdrop: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  inputBg: string;
  statusBarStyle: "light" | "dark";
};

const lightColors: ThemeColors = {
  navy: "#1B2838",
  navyLight: "#243447",
  navyDark: "#131E2B",
  teal: "#0FA3B1",
  tealLight: "#14C4D4",
  tealDark: "#0C8A96",
  tealSoft: "rgba(15, 163, 177, 0.08)",
  tealMuted: "rgba(15, 163, 177, 0.15)",
  gold: "#E8B931",
  goldLight: "#F0CE5E",
  coral: "#FF6B6B",
  mint: "#2ED8A3",
  white: "#FFFFFF",
  offWhite: "#F5F7FA",
  gray50: "#FAFBFC",
  gray100: "#EEF1F5",
  gray200: "#D8DDE5",
  gray300: "#B0B8C4",
  gray400: "#8892A0",
  gray500: "#5F6B7A",
  gray600: "#3E4A5C",
  black: "#0A0E14",
  red: "#E74C3C",
  green: "#27AE60",
  greenLight: "#E8F8F0",
  orange: "#F39C12",
  orangeLight: "#FFF4E0",
  overlay: "rgba(27, 40, 56, 0.7)",
  overlayLight: "rgba(27, 40, 56, 0.45)",
  cardShadow: "rgba(27, 40, 56, 0.12)",
  backdrop: "rgba(0,0,0,0.5)",
  background: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceSecondary: "#FAFBFC",
  text: "#1B2838",
  textSecondary: "#5F6B7A",
  textMuted: "#8892A0",
  border: "#EEF1F5",
  headerBg: "#1B2838",
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#EEF1F5",
  inputBg: "#FFFFFF",
  statusBarStyle: "light",
};

const darkColors: ThemeColors = {
  navy: "#E8EDF2",
  navyLight: "#1E2A3A",
  navyDark: "#0D1520",
  teal: "#14C4D4",
  tealLight: "#1AD8E9",
  tealDark: "#0FA3B1",
  tealSoft: "rgba(20, 196, 212, 0.12)",
  tealMuted: "rgba(20, 196, 212, 0.2)",
  gold: "#F0CE5E",
  goldLight: "#F5DC82",
  coral: "#FF8585",
  mint: "#3EEDB8",
  white: "#FFFFFF",
  offWhite: "#0D1520",
  gray50: "#151F2E",
  gray100: "#1A2738",
  gray200: "#253547",
  gray300: "#3E5068",
  gray400: "#6B7D92",
  gray500: "#94A3B5",
  gray600: "#BCC6D2",
  black: "#FFFFFF",
  red: "#FF6B6B",
  green: "#3EEDB8",
  greenLight: "rgba(62, 237, 184, 0.12)",
  orange: "#FFB347",
  orangeLight: "rgba(255, 179, 71, 0.12)",
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.45)",
  cardShadow: "rgba(0, 0, 0, 0.3)",
  backdrop: "rgba(0,0,0,0.7)",
  background: "#0D1520",
  surface: "#151F2E",
  surfaceSecondary: "#1A2738",
  text: "#E8EDF2",
  textSecondary: "#94A3B5",
  textMuted: "#6B7D92",
  border: "#1A2738",
  headerBg: "#0D1520",
  tabBarBg: "#151F2E",
  tabBarBorder: "#1A2738",
  inputBg: "#1A2738",
  statusBarStyle: "light",
};

export { lightColors, darkColors };

const Colors = darkColors;
export default Colors;
