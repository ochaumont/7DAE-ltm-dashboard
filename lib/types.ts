export type LabTestMeanType = "SIB" | "SIMU" | "FIB" | "RT" | "NA";

export type LabTestMeanStatus =
  | "operational"
  | "mothballed"
  | "out-of-service"
  | "in-project";

export type Complexity = "simple" | "medium" | "complex";

export type TechnicalCapability =
  | "aircraft-simulation-package"
  | "automatic-testing"
  | "remote-access"
  | "no-remote-access";

/**
 * A photo attached to a lab test mean.
 *
 * - `url` always points to the local proxy `/api/photo/[id]?u=<encoded>` —
 *   the binary is streamed by `app/api/photo/[id]/route.ts`, never directly
 *   from the upstream host.
 * - `kind` reflects the `SELECTED` naming convention from the backend
 *   (`name` contains "SELECTED" → cover photo; otherwise → "other"). The
 *   adapter sorts SELECTED photos first in the array.
 * - `is360` is true when the document name ends with `3D.<ext>` in uppercase
 *   — those are equirectangular panoramas rendered through the
 *   `react-photo-sphere-viewer` instead of an `<img>`.
 */
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

export type Manager = Person;

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
  atas: string[];
  technicalCapabilities: TechnicalCapability[];
  projects: string[];
  coverPhoto: string;
  photos: Photo[];
};
