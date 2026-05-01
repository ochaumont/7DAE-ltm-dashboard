import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  fg: "#0f172a",
  muted: "#64748b",
  accent: "#2563eb",
  success: "#047857",
  warning: "#b45309",
  danger: "#b91c1c",
  border: "#e2e8f0",
  bg: "#ffffff",
  surface: "#f8fafc",
};

export const statusColor: Record<string, string> = {
  operational: colors.success,
  mothballed: colors.warning,
  "out-of-service": colors.danger,
  "in-project": colors.accent,
};

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.fg,
    backgroundColor: colors.bg,
  },
  h1: { fontSize: 24, fontFamily: "Helvetica-Bold", color: colors.fg },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", color: colors.fg },
  h3: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  body: { fontSize: 10, color: colors.fg, lineHeight: 1.4 },
  small: { fontSize: 9, color: colors.muted },
  mono: { fontFamily: "Courier", fontSize: 9 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 6,
  },
  row: { flexDirection: "row", alignItems: "center" },
  spaceBetween: { justifyContent: "space-between" },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: colors.bg,
  },
  link: { color: colors.accent, textDecoration: "underline" },
  section: { marginBottom: 12 },
});
