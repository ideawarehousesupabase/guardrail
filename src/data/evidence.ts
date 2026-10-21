import type { EvidenceRecord } from "./types";
import { securityFindings } from "./securityFindings";

const seed: EvidenceRecord[] = [
  {
    id: "EV-2001",
    clientId: "CL-WFA",
    activityType: "Guardrail Review",
    description: "Quarterly review of agreed guardrail baseline with Managing Partner.",
    outcome: "Baseline confirmed",
    timestamp: "2026-09-02T10:00:00Z",
  },
  {
    id: "EV-2002",
    clientId: "CL-WFA",
    activityType: "Exception Closure",
    controlId: "GR-WFA-SHARING",
    description: "Audit file-sharing exception closed after audit completion.",
    outcome: "Closed",
    timestamp: "2026-09-03T14:00:00Z",
    relatedExceptionId: "EX-104",
  },
  {
    id: "EV-2003",
    clientId: "CL-NBH",
    activityType: "Exception Approval",
    controlId: "GR-NBH-DEVICE",
    description: "Exception for legacy imaging workstations approved with network segmentation.",
    outcome: "Approved",
    timestamp: "2026-09-10T16:30:00Z",
    relatedExceptionId: "EX-101",
  },
  {
    id: "EV-2004",
    clientId: "CL-STL",
    activityType: "Security Check",
    controlId: "GR-STL-MFA",
    description: "Scheduled configuration check of MFA registration status.",
    outcome: "Compliant",
    timestamp: "2026-09-25T08:00:00Z",
  },
];

const driftEvidence: EvidenceRecord[] = securityFindings.map((f, i) => ({
  id: `EV-${2005 + i}`,
  clientId: f.clientId,
  activityType: "Drift Detection",
  controlId: f.guardrailId,
  description: `Drift detected: ${f.control} — current "${f.currentValue}".`,
  outcome: `${f.severity} drift recorded`,
  timestamp: f.detectedAt,
  relatedFindingId: f.id,
}));

export const evidence: EvidenceRecord[] = [...seed, ...driftEvidence];
