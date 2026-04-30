import type { DocumentRef, FactsheetRef, LabTestMeanDto } from "./atom-api";
import type {
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
  Manager,
  Person,
  Photo,
  Roles,
} from "./types";

export const COUNTRY_MAP: Record<string, string> = {
  Fr: "France",
  Ge: "Germany",
  UK: "United Kingdom",
};

export const CITY_MAP: Record<string, string> = {
  TLS: "Toulouse",
  HMB: "Hamburg",
  FIL: "Filton",
  BRE: "Bremen",
};

export const GEO_MAP: Record<string, { lat: number; lng: number }> = {
  TLS: { lat: 43.63, lng: 1.37 },
  HMB: { lat: 53.55, lng: 9.99 },
  FIL: { lat: 51.51, lng: -2.58 },
  BRE: { lat: 53.07, lng: 8.8 },
};

const TYPE_MAP: Record<string, LabTestMeanType> = {
  sib: "SIB",
  simu: "SIMU",
  fib: "FIB",
  RT: "RT",
};

const PLACEHOLDER_COVER = "/covers/cover-1.svg";

function isSelected(name: string | null | undefined): boolean {
  return !!name && name.toUpperCase().includes("SELECTED");
}

function toPhotos(
  refs: DocumentRef[] | null | undefined,
  fallbackAlt: string,
): Photo[] {
  if (!refs || refs.length === 0) return [];
  const images = refs.filter((r) => r.documentType?.toLowerCase() === "image");
  const selected: Photo[] = [];
  const others: Photo[] = [];
  for (const r of images) {
    const photo: Photo = {
      url: `/api/photo/${r.id}?u=${encodeURIComponent(r.url)}`,
      alt: r.name && r.name.length > 0 ? r.name : fallbackAlt,
      kind: isSelected(r.name) ? "selected" : "other",
    };
    if (photo.kind === "selected") selected.push(photo);
    else others.push(photo);
  }
  return [...selected, ...others];
}

function toType(raw: LabTestMeanDto["testMeanType"]): LabTestMeanType {
  if (raw == null) return "NA";
  return TYPE_MAP[raw] ?? "NA";
}

function toStatus(dto: LabTestMeanDto): LabTestMeanStatus {
  if (dto.dismantled) return "out-of-service";
  if (dto.mothballed) return "mothballed";
  if (!dto.eisdateyear) return "in-project";
  return "operational";
}

function toPerson(ref: FactsheetRef): Person {
  return { name: ref.name, email: ref.externalId };
}

function toPeople(refs: FactsheetRef[] | undefined): Person[] | undefined {
  if (!refs || refs.length === 0) return undefined;
  return refs.map(toPerson);
}

function toManager(refs: FactsheetRef[] | undefined): Manager | null {
  if (!refs || refs.length === 0) return null;
  const first = refs[0];
  return {
    name: first.name,
    email: first.externalId,
    title: "Bench Manager",
  };
}

function toBool(
  raw: unknown,
  field: string,
  externalId: string,
): boolean | null {
  if (raw === true || raw === false) return raw;
  if (raw == null) return null;
  console.warn(
    `[adapter] ${externalId} · ${field}: unexpected non-boolean value (${typeof raw}) =`,
    raw,
  );
  if (raw === "true" || raw === 1 || raw === "yes") return true;
  if (raw === "false" || raw === 0 || raw === "no") return false;
  return null;
}

export function toLabTestMean(dto: LabTestMeanDto): LabTestMean {
  const site = dto.site ?? "";
  const roles: Roles = {};
  const architects = toPeople(dto.architects);
  if (architects) roles.architects = architects;
  const projectManagers = toPeople(dto.projectManagers);
  if (projectManagers) roles.projectManagers = projectManagers;
  const workPakageLeaders = toPeople(dto.workPakageLeaders);
  if (workPakageLeaders) roles.workPakageLeaders = workPakageLeaders;
  const leadEngineers = toPeople(dto.leadEngineers);
  if (leadEngineers) roles.leadEngineers = leadEngineers;
  const deputies = toPeople(dto.deputies);
  if (deputies) roles.deputies = deputies;
  const depts = toPeople(dto.depts);
  if (depts) roles.depts = depts;

  const lifecycle: LabTestMean["lifecycle"] = {};
  if (dto.kickoff) lifecycle.kickoff = dto.kickoff;
  if (dto.eisdateyear) lifecycle.inService = dto.eisdateyear;
  if (dto.mothballed) lifecycle.mothballed = dto.mothballed;
  if (dto.dismantled) lifecycle.dismantled = dto.dismantled;

  const geo = site ? GEO_MAP[site] : undefined;

  const photos = toPhotos(dto.documentRefs, dto.name);
  const coverPhoto =
    photos.find((p) => p.kind === "selected")?.url ??
    photos[0]?.url ??
    PLACEHOLDER_COVER;

  return {
    id: dto.id,
    externalId: dto.externalId,
    name: dto.name,
    type: toType(dto.testMeanType),
    complexity: dto.complexity ?? null,
    description: dto.description ?? "",
    status: toStatus(dto),
    location: {
      country: dto.country ? COUNTRY_MAP[dto.country] ?? dto.country : "Unknown",
      city: site && CITY_MAP[site] ? CITY_MAP[site] : site || "Unknown",
      site,
      building: dto.building ?? "",
      room: dto.room ?? undefined,
      lat: geo?.lat,
      lng: geo?.lng,
    },
    manager: toManager(dto.managers),
    roles,
    security: {
      ecLevel: dto.ecLevel,
      networkSegregated: toBool(
        dto.networkSegregated,
        "networkSegregated",
        dto.externalId,
      ),
      accesscontrol: toBool(
        dto.accesscontrol,
        "accesscontrol",
        dto.externalId,
      ),
      accesbadge: dto.accesbadge,
      accreditation: dto.accreditation ?? [],
    },
    lifecycle,
    programs: (dto.financeAircraftPrograms ?? []).map((p) => p.name),
    projects: (dto.financeProjects ?? []).map((p) => p.name),
    coverPhoto,
    photos,
  };
}
