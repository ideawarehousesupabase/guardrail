export type GuardrailCategory = "mfa" | "privileged" | "inactive" | "sharing" | "device";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type ServiceTier = "Standard" | "Professional" | "Enterprise";
export type SecurityStatus = "Compliant" | "Minor Drift" | "At Risk" | "Critical";

export interface Client {
  id: string;
  name: string;
  industry: string;
  userCount: number;
  serviceTier: ServiceTier;
  securityMaturity: "Basic" | "Developing" | "Established" | "Managed";
  /** Initial label; the live status is derived from open findings. */
  securityStatus: SecurityStatus;
  m365Summary: string;
  historicalIssues: string[];
  riskFlags: string[];
  /** Current mock configuration level per control (index into control levels). */
  currentConfig: Record<GuardrailCategory, number>;
}

export interface Guardrail {
  id: string;
  clientId: string;
  category: GuardrailCategory;
  name: string;
  expectedLevel: number;
  expectedValue: string;
  currentValue: string;
  justification: string;
  status: "Compliant" | "Drift";
  acceptedAt: string;
}

export interface SecurityFinding {
  id: string;
  clientId: string;
  guardrailId: string;
  category: GuardrailCategory;
  control: string;
  description: string;
  severity: Severity;
  status: "Open" | "Resolved";
  expectedValue: string;
  currentValue: string;
  detectedAt: string;
  resolvedAt?: string | undefined;
}

export type ApprovalStatus = "Pending Approval" | "Approved" | "Rejected";
export type ExceptionStatus = "Pending" | "Active" | "Rejected" | "Closed";

export interface SecurityException {
  id: string;
  clientId: string;
  guardrailId: string;
  findingId?: string | undefined;
  reason: string;
  riskRating: Severity;
  owner: string;
  compensatingControls: string;
  approvalStatus: ApprovalStatus;
  currentStatus: ExceptionStatus;
  expiryDate: string;
  reviewDate: string;
  createdAt: string;
}

export type EvidenceType =
  | "Guardrail Review"
  | "Security Check"
  | "Drift Detection"
  | "Remediation"
  | "Exception Approval"
  | "Exception Closure";

export interface EvidenceRecord {
  id: string;
  clientId: string;
  activityType: EvidenceType;
  controlId?: string | undefined;
  description: string;
  outcome: string;
  timestamp: string;
  relatedFindingId?: string | undefined;
  relatedExceptionId?: string | undefined;
}
