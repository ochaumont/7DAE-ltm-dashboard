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
  testMeanType: "sib" | "simu" | "fib" | "RT" | null;
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

export async function fetchLabTestMeans(): Promise<LabTestMeanDto[]> {
  let res: Response;
  try {
    res = await fetch(`${ATOM_API_BASE_URL}/api/infos/labtestmeans`, {
      next: { revalidate: 60 },
    });
  } catch {
    throw new AtomApiError(
      0,
      "Network error",
      `ATOM API unreachable at ${ATOM_API_BASE_URL}`,
    );
  }
  if (!res.ok) throw new AtomApiError(res.status, res.statusText);
  return (await res.json()) as LabTestMeanDto[];
}
