import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { clients as seedClients } from "@/data/clients";
import { guardrails as seedGuardrails } from "@/data/guardrails";
import { securityFindings as seedFindings } from "@/data/securityFindings";
import { exceptions as seedExceptions } from "@/data/exceptions";
import { evidence as seedEvidence } from "@/data/evidence";
import type {
  Client,
  EvidenceRecord,
  Guardrail,
  SecurityException,
  SecurityFinding,
} from "@/data/types";
import { driftDescription, levelLabel, severityFor } from "@/lib/engine";

interface GieState {
  clients: Client[];
  guardrails: Guardrail[];
  findings: SecurityFinding[];
  exceptions: SecurityException[];
  evidence: EvidenceRecord[];
}

export type NewException = Omit<
  SecurityException,
  "id" | "approvalStatus" | "currentStatus" | "createdAt"
>;

interface GieStore extends GieState {
  acceptGuardrails: (clientId: string, recs: Guardrail[]) => void;
  resolveFinding: (findingId: string) => void;
  createException: (data: NewException) => string;
  approveException: (id: string) => void;
  rejectException: (id: string) => void;
  closeException: (id: string) => void;
}

const Ctx = createContext<GieStore | null>(null);

const nextNum = (ids: string[], base: number) =>
  ids.reduce((m, id) => Math.max(m, Number(id.split("-")[1]) || 0), base) + 1;

export function GieProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GieState>({
    clients: seedClients,
    guardrails: seedGuardrails,
    findings: seedFindings,
    exceptions: seedExceptions,
    evidence: seedEvidence,
  });

  const withEvidence = (
    s: GieState,
    records: Omit<EvidenceRecord, "id" | "timestamp">[],
  ): EvidenceRecord[] => {
    let n = nextNum(
      s.evidence.map((e) => e.id),
      2000,
    );
    const now = new Date().toISOString();
    return [...s.evidence, ...records.map((r) => ({ ...r, id: `EV-${n++}`, timestamp: now }))];
  };

  const acceptGuardrails = useCallback((clientId: string, recs: Guardrail[]) => {
    setState((s) => {
      const now = new Date().toISOString();
      const client = s.clients.find((c) => c.id === clientId);
      if (!client) return s;

      const ev: Omit<EvidenceRecord, "id" | "timestamp">[] = [
        {
          clientId,
          activityType: "Guardrail Review",
          description: `Recommended guardrail baseline accepted (${recs.length} controls).`,
          outcome: "Baseline accepted",
        },
      ];

      // Re-evaluate accepted guardrails with current mock configuration
      const accepted: Guardrail[] = recs.map((r) => {
        const currentLevel = client.currentConfig[r.category] ?? 0;
        const isCompliant = currentLevel >= r.expectedLevel;
        return {
          ...r,
          currentValue: levelLabel(r.category, currentLevel),
          status: isCompliant ? "Compliant" : "Drift",
          acceptedAt: now,
        };
      });

      let findings = [...s.findings];
      let fn = nextNum(
        findings.map((f) => f.id),
        1000,
      );

      for (const g of accepted) {
        const currentLevel = client.currentConfig[g.category] ?? 0;
        const isCompliant = currentLevel >= g.expectedLevel;
        const openFindingsForControl = findings.filter(
          (f) => f.clientId === clientId && f.category === g.category && f.status === "Open",
        );

        if (isCompliant) {
          // If compliant, resolve all open findings for this control
          for (const openF of openFindingsForControl) {
            const idx = findings.findIndex((f) => f.id === openF.id);
            if (idx >= 0) {
              findings[idx] = { ...findings[idx]!, status: "Resolved", resolvedAt: now };
              ev.push({
                clientId,
                activityType: "Security Check",
                controlId: g.id,
                description: `${g.name} meets the updated guardrail; finding closed.`,
                outcome: "Compliant",
                relatedFindingId: openF.id,
              });
            }
          }
        } else {
          // Non-compliant: calculate gap & severity
          const gap = g.expectedLevel - currentLevel;
          const sev = severityFor(g.category, gap);
          const patch = {
            expectedValue: g.expectedValue,
            currentValue: g.currentValue,
            severity: sev,
            guardrailId: g.id,
            description: driftDescription(g.category, g.currentValue, g.expectedValue),
          };

          if (openFindingsForControl.length > 0) {
            // Update the primary active finding
            const primary = openFindingsForControl[0]!;
            const pIdx = findings.findIndex((f) => f.id === primary.id);
            findings[pIdx] = { ...findings[pIdx]!, ...patch };
            ev.push({
              clientId,
              activityType: "Drift Detection",
              controlId: g.id,
              description: `Drift re-evaluated against new guardrail: ${g.name}.`,
              outcome: `${sev} drift recorded`,
              relatedFindingId: primary.id,
            });

            // If duplicate open findings exist for the same control, resolve them
            for (let i = 1; i < openFindingsForControl.length; i++) {
              const dupIdx = findings.findIndex((f) => f.id === openFindingsForControl[i]!.id);
              if (dupIdx >= 0) {
                findings[dupIdx] = { ...findings[dupIdx]!, status: "Resolved", resolvedAt: now };
              }
            }
          } else {
            // No open finding exists, create one
            const id = `DR-${fn++}`;
            findings = [
              ...findings,
              {
                id,
                clientId,
                category: g.category,
                control: g.name,
                status: "Open",
                detectedAt: now,
                ...patch,
              },
            ];
            ev.push({
              clientId,
              activityType: "Drift Detection",
              controlId: g.id,
              description: `Drift detected: ${g.name} — current "${g.currentValue}".`,
              outcome: `${sev} drift recorded`,
              relatedFindingId: id,
            });
          }
        }
      }

      return {
        ...s,
        guardrails: [...s.guardrails.filter((g) => g.clientId !== clientId), ...accepted],
        findings,
        evidence: withEvidence(s, ev),
      };
    });
  }, []);

  const resolveFinding = useCallback((findingId: string) => {
    setState((s) => {
      const f = s.findings.find((x) => x.id === findingId);
      if (!f || f.status === "Resolved") return s;
      const g = s.guardrails.find((x) => x.id === f.guardrailId);
      const level = g?.expectedLevel ?? 0;
      const now = new Date().toISOString();
      const newValue = levelLabel(f.category, level);
      return {
        ...s,
        clients: s.clients.map((c) =>
          c.id === f.clientId
            ? { ...c, currentConfig: { ...c.currentConfig, [f.category]: level } }
            : c,
        ),
        guardrails: s.guardrails.map((x) =>
          x.id === f.guardrailId ? { ...x, currentValue: newValue, status: "Compliant" } : x,
        ),
        findings: s.findings.map((x) =>
          x.id === findingId ||
          (x.clientId === f.clientId && x.category === f.category && x.status === "Open")
            ? { ...x, status: "Resolved", resolvedAt: now }
            : x,
        ),
        evidence: withEvidence(s, [
          {
            clientId: f.clientId,
            activityType: "Remediation",
            controlId: f.guardrailId,
            description: `Simulated remediation: ${f.control} set to "${newValue}".`,
            outcome: "Resolved",
            relatedFindingId: f.id,
          },
        ]),
      };
    });
  }, []);

  const createException = useCallback((data: NewException) => {
    let newId = "";
    setState((s) => {
      newId = `EX-${nextNum(
        s.exceptions.map((e) => e.id),
        100,
      )}`;
      const ex: SecurityException = {
        ...data,
        id: newId,
        approvalStatus: "Pending Approval",
        currentStatus: "Pending",
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        exceptions: [...s.exceptions, ex],
        evidence: withEvidence(s, [
          {
            clientId: data.clientId,
            activityType: "Exception Approval",
            controlId: data.guardrailId,
            description: `Exception requested: ${data.reason}`,
            outcome: "Pending approval",
            relatedExceptionId: newId,
            relatedFindingId: data.findingId,
          },
        ]),
      };
    });
    return newId;
  }, []);

  const transition = useCallback(
    (
      id: string,
      patch: Partial<SecurityException>,
      type: EvidenceRecord["activityType"],
      outcome: string,
      verb: string,
    ) =>
      setState((s) => {
        const ex = s.exceptions.find((e) => e.id === id);
        if (!ex) return s;
        return {
          ...s,
          exceptions: s.exceptions.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          evidence: withEvidence(s, [
            {
              clientId: ex.clientId,
              activityType: type,
              controlId: ex.guardrailId,
              description: `Exception ${id} ${verb}.`,
              outcome,
              relatedExceptionId: id,
              relatedFindingId: ex.findingId,
            },
          ]),
        };
      }),
    [],
  );

  const approveException = useCallback(
    (id: string) =>
      transition(
        id,
        { approvalStatus: "Approved", currentStatus: "Active" },
        "Exception Approval",
        "Approved",
        "approved",
      ),
    [transition],
  );
  const rejectException = useCallback(
    (id: string) =>
      transition(
        id,
        { approvalStatus: "Rejected", currentStatus: "Rejected" },
        "Exception Approval",
        "Rejected",
        "rejected",
      ),
    [transition],
  );
  const closeException = useCallback(
    (id: string) =>
      transition(id, { currentStatus: "Closed" }, "Exception Closure", "Closed", "closed"),
    [transition],
  );

  const value = useMemo(
    () => ({
      ...state,
      acceptGuardrails,
      resolveFinding,
      createException,
      approveException,
      rejectException,
      closeException,
    }),
    [
      state,
      acceptGuardrails,
      resolveFinding,
      createException,
      approveException,
      rejectException,
      closeException,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGie() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGie must be used inside GieProvider");
  return v;
}
