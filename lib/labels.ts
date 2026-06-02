import { COMPLEXITY_NA } from "@/lib/labtestmeans";
import type { LabTestMeanStatus, LabTestMeanType } from "@/lib/types";

export const STATUS_LABELS: Record<LabTestMeanStatus, string> = {
  operational: "Operational",
  mothballed: "Mothballed",
  "out-of-service": "Out of Service",
  "in-project": "In Project",
};

export const TYPE_LABELS: Record<LabTestMeanType, string> = {
  SIB: "SIB",
  SIMU: "SIMU",
  FIB: "FIB",
  RT: "Mean ResearchOnTest",
  NA: "NA",
};

export const COMPLEXITY_LABELS: Record<string, string> = {
  simple: "Simple",
  medium: "Medium",
  complex: "Complex",
  [COMPLEXITY_NA]: "NA",
};
