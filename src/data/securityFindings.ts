import { clients } from "./clients";
import { agreedBaselines } from "./guardrails";
import type { SecurityFinding } from "./types";
import { detectDrift, driftDescription, guardrailId, levelLabel } from "@/lib/engine";
import { CONTROL_BY_KEY } from "./controls";

const detectionDates = [
  "2026-10-02T07:12:00Z",
  "2026-10-05T09:40:00Z",
  "2026-10-08T06:55:00Z",
  "2026-10-11T13:20:00Z",
  "2026-10-14T08:05:00Z",
  "2026-10-16T10:30:00Z",
  "2026-10-18T07:45:00Z",
  "2026-10-19T15:10:00Z",
];

let n = 0;
export const securityFindings: SecurityFinding[] = clients.flatMap((client) =>
  detectDrift(agreedBaselines[client.id]!, client.currentConfig).map((d) => {
    const expected = levelLabel(d.category, d.expectedLevel);
    const current = levelLabel(d.category, d.currentLevel);
    const finding: SecurityFinding = {
      id: `DR-${1001 + n}`,
      clientId: client.id,
      guardrailId: guardrailId(client.id, d.category),
      category: d.category,
      control: CONTROL_BY_KEY[d.category].name,
      description: driftDescription(d.category, current, expected),
      severity: d.severity,
      status: "Open",
      expectedValue: expected,
      currentValue: current,
      detectedAt: detectionDates[n % detectionDates.length]!,
    };
    n++;
    return finding;
  }),
);
