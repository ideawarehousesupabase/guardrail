import { CONTROLS, CONTROL_BY_KEY } from "@/data/controls";
import type {
  Client,
  Guardrail,
  GuardrailCategory,
  SecurityException,
  SecurityFinding,
  SecurityStatus,
  Severity,
} from "@/data/types";

export const levelLabel = (cat: GuardrailCategory, level: number): string =>
  CONTROL_BY_KEY[cat].levels[Math.max(0, Math.min(level, CONTROL_BY_KEY[cat].levels.length - 1))]!;

export const guardrailId = (clientId: string, cat: GuardrailCategory) =>
  `GR-${clientId.slice(3)}-${cat.toUpperCase()}`;

export function severityFor(cat: GuardrailCategory, gap: number): Severity {
  if (gap >= 3) return "Critical";
  if (gap === 2) return "High";
  return cat === "mfa" || cat === "privileged" ? "Medium" : "Low";
}

export function buildGuardrail(
  client: Client,
  cat: GuardrailCategory,
  expectedLevel: number,
  justification: string,
  acceptedAt: string,
): Guardrail {
  const current = client.currentConfig[cat];
  return {
    id: guardrailId(client.id, cat),
    clientId: client.id,
    category: cat,
    name: CONTROL_BY_KEY[cat].name,
    expectedLevel,
    expectedValue: levelLabel(cat, expectedLevel),
    currentValue: levelLabel(cat, current),
    justification,
    status: current >= expectedLevel ? "Compliant" : "Drift",
    acceptedAt,
  };
}

const HIGH_SENSITIVITY = ["Legal Services", "Healthcare Services", "Accounting"];

/** Deterministic, rule-based recommendation of the five guardrails for a client profile. */
export function generateGuardrails(client: Client): Guardrail[] {
  const sensitive = HIGH_SENSITIVITY.includes(client.industry);
  const flags = client.riskFlags;
  const now = new Date().toISOString();
  const recs: Record<GuardrailCategory, [number, string]> = {
    mfa:
      flags.includes("phishing") || flags.includes("invoiceFraud")
        ? [
            4,
            `Prior ${flags.includes("phishing") ? "credential phishing" : "invoice-fraud"} activity means app-based codes can be relayed; phishing-resistant methods are recommended.`,
          ]
        : sensitive
          ? [
              3,
              `${client.industry} handles confidential data; authenticator-app MFA for every user is the minimum baseline.`,
            ]
          : [
              3,
              `With ${client.userCount} users and no MFA history, authenticator-app MFA for all users removes the most common account-takeover route.`,
            ],
    privileged:
      client.userCount > 100 || client.serviceTier === "Enterprise"
        ? [
            3,
            `A ${client.userCount}-user ${client.serviceTier} environment warrants just-in-time elevation instead of standing admin rights.`,
          ]
        : [
            2,
            `For an organisation of ${client.userCount} users, separate admin accounts with monthly review keep privileged access contained.`,
          ],
    inactive:
      flags.includes("seasonalStaff") || client.userCount > 200
        ? [
            3,
            "High staff turnover leaves dormant accounts; disabling after 45 days limits exposure from leavers.",
          ]
        : [2, "Disabling accounts after 90 days of inactivity removes forgotten access points."],
    sharing:
      client.industry === "Legal Services" ||
      client.industry === "Healthcare Services" ||
      client.industry === "Accounting"
        ? [
            3,
            flags.includes("dataSharing")
              ? "Case files were previously shared anonymously; restrict sharing to approved partner domains."
              : `${client.industry} data should only be shared with approved partner domains.`,
          ]
        : [2, "Requiring authenticated guests ensures every external recipient is identifiable."],
    device:
      flags.includes("lostDevice") || client.industry === "Healthcare Services"
        ? [
            3,
            "Patient data on endpoints and a prior lost-device incident require encrypted, compliant devices for all apps.",
          ]
        : flags.includes("sharedDevices")
          ? [2, "Shared depot devices must meet compliance before accessing email and files."]
          : [
              2,
              "Requiring compliant devices for email and files prevents data on unmanaged endpoints.",
            ],
  };
  return CONTROLS.map((c) => buildGuardrail(client, c.key, recs[c.key][0], recs[c.key][1], now));
}

export interface DriftResult {
  category: GuardrailCategory;
  expectedLevel: number;
  currentLevel: number;
  gap: number;
  severity: Severity;
}

/** Compares expected guardrail levels with current mock configuration levels. */
export function detectDrift(
  expectedConfig: Partial<Record<GuardrailCategory, number>>,
  currentConfig: Record<GuardrailCategory, number>,
): DriftResult[] {
  return CONTROLS.flatMap((c) => {
    const expected = expectedConfig[c.key];
    if (expected === undefined) return [];
    const current = currentConfig[c.key];
    if (current >= expected) return [];
    const gap = expected - current;
    return [
      {
        category: c.key,
        expectedLevel: expected,
        currentLevel: current,
        gap,
        severity: severityFor(c.key, gap),
      },
    ];
  });
}

export const driftDescription = (cat: GuardrailCategory, current: string, expected: string) =>
  `${CONTROL_BY_KEY[cat].name} is configured as "${current}", which does not meet the agreed guardrail "${expected}".`;

export type EffectiveExceptionStatus = "Pending" | "Active" | "Expired" | "Rejected" | "Closed";

export function effectiveExceptionStatus(
  ex: SecurityException,
  today = new Date(),
): EffectiveExceptionStatus {
  if (ex.currentStatus === "Active") {
    const expiry = new Date(ex.expiryDate + "T23:59:59");
    return expiry < today ? "Expired" : "Active";
  }
  return ex.currentStatus;
}

export function clientStatus(openFindings: SecurityFinding[]): SecurityStatus {
  if (openFindings.some((f) => f.severity === "Critical")) return "Critical";
  if (openFindings.some((f) => f.severity === "High")) return "At Risk";
  if (openFindings.length) return "Minor Drift";
  return "Compliant";
}
