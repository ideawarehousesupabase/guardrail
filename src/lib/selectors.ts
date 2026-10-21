import { useMemo } from "react";
import { useGie } from "@/state/gie-store";
import { clientStatus, effectiveExceptionStatus } from "./engine";
import type { SecurityFinding, Severity } from "@/data/types";

export interface FindingStats {
  total: number;
  open: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  bySeverity: { severity: Severity; count: number; openCount: number }[];
}

export function calculateFindingStats(findings: SecurityFinding[]): FindingStats {
  const open = findings.filter((f) => f.status === "Open");
  const resolved = findings.filter((f) => f.status === "Resolved");
  const critical = open.filter((f) => f.severity === "Critical").length;
  const high = open.filter((f) => f.severity === "High").length;
  const medium = open.filter((f) => f.severity === "Medium").length;
  const low = open.filter((f) => f.severity === "Low").length;

  const bySeverity: { severity: Severity; count: number; openCount: number }[] = [
    {
      severity: "Critical",
      count: findings.filter((f) => f.severity === "Critical").length,
      openCount: critical,
    },
    {
      severity: "High",
      count: findings.filter((f) => f.severity === "High").length,
      openCount: high,
    },
    {
      severity: "Medium",
      count: findings.filter((f) => f.severity === "Medium").length,
      openCount: medium,
    },
    { severity: "Low", count: findings.filter((f) => f.severity === "Low").length, openCount: low },
  ];

  return {
    total: findings.length,
    open: open.length,
    resolved: resolved.length,
    critical,
    high,
    medium,
    low,
    bySeverity,
  };
}

export function useFindingStats(clientId?: string) {
  const { findings } = useGie();
  return useMemo(() => {
    const scoped =
      clientId && clientId !== "all" ? findings.filter((f) => f.clientId === clientId) : findings;
    return calculateFindingStats(scoped);
  }, [findings, clientId]);
}

/** Derived per-client figures computed from shared state. */
export function useClientSummaries() {
  const { clients, findings, exceptions, guardrails } = useGie();
  return useMemo(
    () =>
      clients.map((c) => {
        const open = findings.filter((f) => f.clientId === c.id && f.status === "Open");
        const exs = exceptions.filter((e) => e.clientId === c.id);
        const openEx = exs.filter((e) =>
          ["Pending", "Active"].includes(effectiveExceptionStatus(e)),
        );
        const gr = guardrails.filter((g) => g.clientId === c.id);
        return {
          client: c,
          status: clientStatus(open),
          openFindings: open,
          openExceptions: openEx,
          guardrails: gr,
        };
      }),
    [clients, findings, exceptions, guardrails],
  );
}

export function useClientName() {
  const { clients } = useGie();
  return (id: string) => clients.find((c) => c.id === id)?.name ?? id;
}
