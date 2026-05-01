import { Page, Text, View } from "@react-pdf/renderer";
import { styles, colors } from "./styles";

type Props = {
  benchCount: number;
  filtersDescription: string;
};

export default function CoverPage({ benchCount, filtersDescription }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Page size="A4" style={styles.page}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text
          style={{
            fontSize: 32,
            fontFamily: "Helvetica-Bold",
            letterSpacing: 4,
            color: colors.accent,
          }}
        >
          AIRBUS
        </Text>
        <Text style={{ ...styles.small, marginTop: 4, letterSpacing: 2 }}>
          ATOM
        </Text>

        <View style={{ height: 40 }} />

        <Text style={{ ...styles.h1, textAlign: "center" }}>
          Lab Test Means
        </Text>
        <Text style={{ ...styles.h2, marginTop: 4, color: colors.muted }}>
          Catalogue Export
        </Text>

        <View style={{ height: 30 }} />

        <Text style={{ ...styles.body, color: colors.muted }}>{today}</Text>
        <Text style={{ ...styles.h2, marginTop: 12, color: colors.fg }}>
          {benchCount} {benchCount === 1 ? "bench" : "benches"} included
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
        }}
      >
        <Text style={styles.h3}>Active Filters</Text>
        <View style={{ marginTop: 6 }}>
          {filtersDescription.split("\n").map((line, i) => (
            <Text key={i} style={styles.body}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </Page>
  );
}
