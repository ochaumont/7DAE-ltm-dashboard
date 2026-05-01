export const ATOM_API_BASE_URL =
  process.env.ATOM_API_BASE_URL ??
  "http://localhost:8080/atom-synchronizer-dev";

export type FactsheetRef = {
  id: string;
  externalId: string;
  name: string;
  etags?: unknown;
  userSubscriptions?: unknown;
};

export type FinanceRef = {
  id?: string;
  name: string;
};

export type DocumentRef = {
  id: string;
  name: string | null;
  documentType: string;
  url: string;
};

export type LabTestMeanDto = {
  id: string;
  externalId: string;
  name: string;
  category: "sib" | "simu" | "fib" | "RT" | null;
  complexity: "simple" | "medium" | "complex" | null;
  country: string | null;
  site: string | null;
  building: string | null;
  room: string | null;
  description: string | null;
  shortDescription: string | null;
  kickoff: string | null;
  eisdateyear: string | null;
  mothballed: string | null;
  dismantled: string | null;
  managers: FactsheetRef[];
  architects: FactsheetRef[];
  projectManagers: FactsheetRef[];
  workPakageLeaders: FactsheetRef[];
  leadEngineers: FactsheetRef[];
  deputies: FactsheetRef[];
  depts: FactsheetRef[];
  ecLevel: string | null;
  networkSegregated: boolean | null;
  accesscontrol: boolean | null;
  accesbadge: string | null;
  accreditation: string[] | null;
  atas: string[] | null;
  technicalCapabilities: string[] | null;
  financeAircraftPrograms: FinanceRef[] | null;
  financeProjects: FinanceRef[] | null;
  documentRefs: DocumentRef[] | null;
};

export class AtomApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message ?? `ATOM API error ${status} ${statusText}`);
    this.name = "AtomApiError";
  }
}

/** Wall-clock timeout for any single ATOM API call (ms). */
const FETCH_TIMEOUT_MS = 15_000;

async function atomFetch(
  url: string,
  init: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new AtomApiError(
        0,
        "Timeout",
        // `ATOM_BACKEND_DOWN:` is a machine-readable prefix consumed by
        // `app/error.tsx` to render the dedicated "API unavailable" screen.
        // Keep the prefix stable; the human-readable suffix may change.
        `ATOM_BACKEND_DOWN: timeout after ${FETCH_TIMEOUT_MS}ms at ${ATOM_API_BASE_URL}`,
      );
    }
    throw new AtomApiError(
      0,
      "Network error",
      `ATOM_BACKEND_DOWN: unreachable at ${ATOM_API_BASE_URL}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLabTestMeans(): Promise<LabTestMeanDto[]> {
  const res = await atomFetch(
    `${ATOM_API_BASE_URL}/api/infos/labtestmeans`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) throw new AtomApiError(res.status, res.statusText);
  return (await res.json()) as LabTestMeanDto[];
}

export async function fetchLabTestMean(
  externalId: string,
): Promise<LabTestMeanDto | null> {
  const res = await atomFetch(
    `${ATOM_API_BASE_URL}/api/infos/labtestmeans/${encodeURIComponent(externalId)}`,
    { next: { revalidate: 60 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new AtomApiError(res.status, res.statusText);
  return (await res.json()) as LabTestMeanDto;
}
