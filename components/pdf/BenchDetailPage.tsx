import { Page, Text, View, Link, Image } from "@react-pdf/renderer";
import type { LabTestMean } from "@/lib/types";
import { styles, colors, statusColor } from "./styles";
import { STATUS_LABELS, COMPLEXITY_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format-date";

type ResolvedBench = LabTestMean & { resolvedCover: string | null };

type Props = {
  banc: ResolvedBench;
  baseUrl: string;
};

const CAPABILITY_LABELS: Record<string, string> = {
  "aircraft-simulation-package": "Aircraft Simulation Package",
  "automatic-testing": "Automatic Testing",
  "remote-access": "Remote Access",
  "no-remote-access": "No Remote Access",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text
        style={{
          ...styles.small,
          width: 80,
          color: colors.muted,
        }}
      >
        {label}
      </Text>
      <Text style={{ ...styles.body, flex: 1 }}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.h3}>{title}</Text>
      <View style={{ marginTop: 4 }}>{children}</View>
    </View>
  );
}

export default function BenchDetailPage({ banc, baseUrl }: Props) {
  const status = STATUS_LABELS[banc.status] ?? banc.status;
  const statusBg = statusColor[banc.status] ?? colors.muted;

  const localityParts = [
    banc.location.country,
    banc.location.city,
    banc.location.building,
    banc.location.room,
  ].filter((s): s is string => !!s && s.length > 0);

  const projectManager = banc.roles.projectManagers?.[0];

  return (
    <Page size="A4" style={styles.page} id={`bench-${banc.externalId}`}>
      {/* Header */}
      <View style={styles.section}>
        <Text style={styles.h1}>{banc.name}</Text>
        <View
          style={{
            ...styles.row,
            marginTop: 4,
            flexWrap: "wrap",
          }}
        >
          <Text style={{ ...styles.mono, color: colors.muted, marginRight: 10 }}>
            [{banc.externalId}]
          </Text>
          <Text style={{ ...styles.badge, backgroundColor: statusBg }}>
            {status}
          </Text>
        </View>
      </View>

      {/* Photo */}
      <View
        style={{
          height: 180,
          marginBottom: 12,
          backgroundColor: colors.surface,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {banc.resolvedCover ? (
          <Image
            src={banc.resolvedCover}
            style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain" }}
          />
        ) : (
          <Text style={styles.small}>No photo available</Text>
        )}
      </View>

      {/* Two columns */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Section title="Identity">
            <Field label="Type" value={banc.type} />
            <Field
              label="Complexity"
              value={
                banc.complexity
                  ? COMPLEXITY_LABELS[banc.complexity] ?? banc.complexity
                  : "—"
              }
            />
            <Field
              label="Access"
              value={
                banc.security.accesscontrol === true
                  ? "Secured"
                  : banc.security.accesscontrol === false
                    ? "Not secured"
                    : "—"
              }
            />
          </Section>

          <Section title="Location">
            <Text style={styles.body}>
              {localityParts.length > 0 ? localityParts.join(" · ") : "—"}
            </Text>
          </Section>

          <Section title="Aircraft Programs">
            <Text style={styles.body}>
              {banc.programs.length > 0 ? banc.programs.join(", ") : "—"}
            </Text>
          </Section>

          <Section title="ATA Chapters">
            <Text style={styles.body}>
              {banc.atas.length > 0
                ? banc.atas.map((a) => `ATA ${a}`).join(", ")
                : "—"}
            </Text>
          </Section>

          <Section title="Technical Capabilities">
            <Text style={styles.body}>
              {banc.technicalCapabilities.length > 0
                ? banc.technicalCapabilities
                    .map((c) => CAPABILITY_LABELS[c] ?? c)
                    .join(", ")
                : "—"}
            </Text>
          </Section>
        </View>

        <View style={{ flex: 1 }}>
          <Section title="Lifecycle">
            <Field label="Kickoff" value={formatDate(banc.lifecycle.kickoff)} />
            <Field
              label="In Service"
              value={formatDate(banc.lifecycle.inService)}
            />
            <Field
              label="Mothballed"
              value={formatDate(banc.lifecycle.mothballed)}
            />
            <Field
              label="Dismantled"
              value={formatDate(banc.lifecycle.dismantled)}
            />
          </Section>

          {(banc.manager || projectManager) && (
            <Section title="People">
              {banc.manager && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.small}>Bench Manager</Text>
                  <Text style={styles.body}>{banc.manager.name}</Text>
                  {banc.manager.email && (
                    <Text style={{ ...styles.small, color: colors.muted }}>
                      {banc.manager.email}
                    </Text>
                  )}
                </View>
              )}
              {projectManager && (
                <View>
                  <Text style={styles.small}>Project Manager</Text>
                  <Text style={styles.body}>{projectManager.name}</Text>
                  {projectManager.email && (
                    <Text style={{ ...styles.small, color: colors.muted }}>
                      {projectManager.email}
                    </Text>
                  )}
                </View>
              )}
            </Section>
          )}
        </View>
      </View>

      {/* Footer link */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 40,
          right: 40,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingTop: 8,
        }}
        fixed
      >
        <Link
          src={`${baseUrl}/labtestmean/${banc.externalId}`}
          style={{ ...styles.small, color: colors.accent }}
        >
          <Text>View on dashboard ↗</Text>
        </Link>
      </View>
    </Page>
  );
}
