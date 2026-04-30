export type LabTestMeanType = "SIB" | "SIMU" | "FIB" | "RT" | "NA";

export type LabTestMeanStatus =
  | "operational"
  | "mothballed"
  | "out-of-service"
  | "in-project";

export type Complexity = "simple" | "medium" | "complex";

export type Photo = {
  url: string;
  alt?: string;
  kind?: "selected" | "other";
  is360?: boolean;
};

export type Location = {
  country: string;
  city: string;
  site: string;
  building: string;
  room?: string;
  lat?: number;
  lng?: number;
};

export type Person = {
  name: string;
  email: string;
};

export type Manager = Person & {
  title: string;
};

export type Security = {
  ecLevel: string | null;
  networkSegregated: boolean | null;
  accesscontrol: boolean | null;
  accesbadge: string | null;
  accreditation: string[];
};

export type Roles = {
  architects?: Person[];
  projectManagers?: Person[];
  workPakageLeaders?: Person[];
  leadEngineers?: Person[];
  deputies?: Person[];
  depts?: Person[];
};

export type Lifecycle = {
  kickoff?: string;
  inService?: string;
  mothballed?: string;
  dismantled?: string;
};

export type LabTestMean = {
  id: string;
  externalId: string;
  name: string;
  type: LabTestMeanType;
  complexity: Complexity | null;
  description: string;
  status: LabTestMeanStatus;
  location: Location;
  manager: Manager | null;
  roles: Roles;
  security: Security;
  lifecycle: Lifecycle;
  programs: string[];
  projects: string[];
  coverPhoto: string;
  photos: Photo[];
};
