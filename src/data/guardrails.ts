import { CONTROLS } from "./controls";
import { clients } from "./clients";
import type { Guardrail, GuardrailCategory } from "./types";
import { buildGuardrail } from "@/lib/engine";

/** Previously agreed baseline levels per client (before any new recommendation). */
export const agreedBaselines: Record<string, Record<GuardrailCategory, number>> = {
  "CL-ABC": { mfa: 3, privileged: 2, inactive: 2, sharing: 2, device: 2 },
  "CL-NBH": { mfa: 3, privileged: 2, inactive: 2, sharing: 2, device: 3 },
  "CL-MER": { mfa: 3, privileged: 2, inactive: 2, sharing: 1, device: 1 },
  "CL-WFA": { mfa: 3, privileged: 2, inactive: 2, sharing: 3, device: 2 },
  "CL-STL": { mfa: 2, privileged: 2, inactive: 2, sharing: 1, device: 2 },
};

export const baselineAcceptedAt: Record<string, string> = {
  "CL-ABC": "2026-06-12T10:00:00Z",
  "CL-NBH": "2026-05-20T09:30:00Z",
  "CL-MER": "2026-07-03T14:15:00Z",
  "CL-WFA": "2026-04-28T11:00:00Z",
  "CL-STL": "2026-06-30T08:45:00Z",
};

export const guardrails: Guardrail[] = clients.flatMap((client) =>
  CONTROLS.map((c) =>
    buildGuardrail(
      client,
      c.key,
      agreedBaselines[client.id]![c.key],
      "Baseline agreed with the client during onboarding.",
      baselineAcceptedAt[client.id]!,
    ),
  ),
);
