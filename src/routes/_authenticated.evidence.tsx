import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClientSelector,
  DetailRow,
  EmptyState,
  FilterDropdown,
  Mono,
  PageHeader,
  Panel,
  SearchInput,
  fmtDateTime,
} from "@/components/gie/ui-bits";
import { useGie } from "@/state/gie-store";
import { useClientName } from "@/lib/selectors";
import type { EvidenceRecord } from "@/data/types";

const TYPES: EvidenceRecord["activityType"][] = [
  "Guardrail Review",
  "Security Check",
  "Drift Detection",
  "Remediation",
  "Exception Approval",
  "Exception Closure",
];

export const Route = createFileRoute("/_authenticated/evidence")({
  validateSearch: (s: Record<string, unknown>): { client?: string | undefined } => ({
    client: typeof s["client"] === "string" ? s["client"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Evidence Ledger — GIE" },
      {
        name: "description",
        content: "Evidence created by default from security-delivery activities.",
      },
      { property: "og:title", content: "Evidence Ledger — GIE" },
      {
        property: "og:description",
        content: "Evidence created by default from security-delivery activities.",
      },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  const { evidence, guardrails } = useGie();
  const name = useClientName();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/evidence" });
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const control = (id?: string) => (id ? (guardrails.find((g) => g.id === id)?.name ?? id) : "—");

  const rows = evidence
    .filter(
      (e) =>
        (!search.client || e.clientId === search.client) &&
        (type === "all" || e.activityType === type),
    )
    .filter((e) => {
      const t = q.toLowerCase();
      return (
        !t ||
        [e.id, e.description, name(e.clientId), e.outcome, control(e.controlId)].some((v) =>
          v.toLowerCase().includes(t),
        )
      );
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const sel = evidence.find((e) => e.id === openId);

  return (
    <>
      <PageHeader
        title="Evidence-by-Default Ledger"
        description="Records are generated automatically when security-delivery activities are performed. Immutable evidence ledger for audit readiness and compliance tracking."
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={q} onChange={setQ} placeholder="Search evidence" />
        <ClientSelector
          value={search.client ?? "all"}
          onChange={(v) =>
            navigate({ search: { client: v === "all" ? undefined : v }, replace: true })
          }
        />
        <FilterDropdown
          label="Activity types"
          value={type}
          onChange={setType}
          options={TYPES.map((t) => ({ value: t, label: t }))}
        />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="No evidence records found" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1020px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 whitespace-nowrap min-w-[130px]">
                    Evidence ID
                  </TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Client</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Activity Type</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[170px]">
                    Related Security Control
                  </TableHead>
                  <TableHead className="min-w-[280px]">Description</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Timestamp</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[140px]">Outcome</TableHead>
                  <TableHead className="pr-5 text-right whitespace-nowrap min-w-[90px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-5 whitespace-nowrap">
                      <Mono>{e.id}</Mono>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {name(e.clientId)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-primary">
                      {e.activityType}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{control(e.controlId)}</TableCell>
                    <TableCell className="min-w-[280px] text-sm text-muted-foreground">
                      {e.description}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {fmtDateTime(e.timestamp)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{e.outcome}</TableCell>
                    <TableCell className="pr-5 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(e.id)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="sm:max-w-xl">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>Evidence {sel.id}</DialogTitle>
                <DialogDescription>
                  Verified evidence record captured from security delivery telemetry.
                </DialogDescription>
              </DialogHeader>
              <dl className="divide-y">
                <DetailRow label="Customer">{name(sel.clientId)}</DetailRow>
                <DetailRow label="Activity">{sel.activityType}</DetailRow>
                <DetailRow label="Relevant control">{control(sel.controlId)}</DetailRow>
                <DetailRow label="Action description">{sel.description}</DetailRow>
                <DetailRow label="Date and time">{fmtDateTime(sel.timestamp)}</DetailRow>
                <DetailRow label="Outcome">{sel.outcome}</DetailRow>
                <DetailRow label="Associated finding">
                  {sel.relatedFindingId ? (
                    <Link
                      to="/drift"
                      search={{ finding: sel.relatedFindingId }}
                      className="text-primary hover:underline"
                    >
                      {sel.relatedFindingId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="Associated exception">
                  {sel.relatedExceptionId ? (
                    <Link
                      to="/exceptions"
                      search={{ view: sel.relatedExceptionId }}
                      className="text-primary hover:underline"
                    >
                      {sel.relatedExceptionId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </DetailRow>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
