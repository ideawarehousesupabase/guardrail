import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Panel, StatusBadge, fmtDate, fmtDateTime } from "@/components/gie/ui-bits";
import { useGie } from "@/state/gie-store";
import { calculateFindingStats, useClientSummaries } from "@/lib/selectors";
import { effectiveExceptionStatus } from "@/lib/engine";
import { useDemoAuth } from "@/lib/demo-auth";

export const Route = createFileRoute("/_authenticated/clients/$clientId_/report")({
  head: () => ({
    meta: [
      { title: "Client Security Report — GIE" },
      { name: "description", content: "Printable security summary for a managed client." },
      { property: "og:title", content: "Client Security Report — GIE" },
      { property: "og:description", content: "Printable security summary for a managed client." },
    ],
  }),
  component: Report,
});

function Report() {
  const { clientId } = Route.useParams();
  const { findings, exceptions, evidence } = useGie();
  const { session } = useDemoAuth();
  const s = useClientSummaries().find((x) => x.client.id === clientId);
  if (!s) return <EmptyState title="Client not found" />;
  const { client, guardrails, status } = s;
  const cf = findings.filter((f) => f.clientId === clientId);
  const fStats = calculateFindingStats(cf);
  const activeEx = exceptions.filter(
    (e) => e.clientId === clientId && effectiveExceptionStatus(e) === "Active",
  );
  const recent = evidence
    .filter((e) => e.clientId === clientId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);
  const compliant = guardrails.filter((g) => g.status === "Compliant").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/clients/$clientId" params={{ clientId }}>
            <ArrowLeft className="size-4" /> Back to client
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> Print Report
        </Button>
      </div>

      <Panel>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Client Security Report
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              {client.industry} · {client.userCount} users · {client.serviceTier} tier
            </p>
          </div>
          <div className="text-sm sm:text-right">
            <StatusBadge status={status} />
            <p className="mt-2 text-xs text-muted-foreground">
              Prepared by {session?.organisationName}
            </p>
            <p className="text-xs text-muted-foreground">{fmtDateTime(new Date().toISOString())}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t bg-border sm:grid-cols-4">
          {[
            ["Guardrails", guardrails.length],
            ["Compliant", `${compliant}/${guardrails.length}`],
            ["Open findings", fStats.open],
            ["Resolved findings", fStats.resolved],
          ].map(([k, v]) => (
            <div key={k} className="bg-card p-4">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-xl font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Assigned Security Guardrails">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Control</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Current</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardrails.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="pl-5 font-medium">{g.name}</TableCell>
                <TableCell>{g.expectedValue}</TableCell>
                <TableCell className="text-muted-foreground">{g.currentValue}</TableCell>
                <TableCell className="pr-5">
                  <StatusBadge status={g.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Drift Findings">
        {cf.length === 0 ? (
          <EmptyState title="No drift findings" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">ID</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cf.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="pl-5 font-mono text-xs">{f.id}</TableCell>
                  <TableCell>{f.control}</TableCell>
                  <TableCell>
                    <StatusBadge status={f.severity} />
                  </TableCell>
                  <TableCell className="text-xs">{fmtDate(f.detectedAt)}</TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={f.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Active Security Exceptions">
          {activeEx.length === 0 ? (
            <EmptyState title="No active exceptions" />
          ) : (
            <ul className="divide-y">
              {activeEx.map((e) => (
                <li key={e.id} className="px-5 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{e.id}</span> ·{" "}
                  {e.reason}
                  <p className="text-xs text-muted-foreground">
                    Owner: {e.owner} · Expires {fmtDate(e.expiryDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent Evidence Activity">
          <ul className="divide-y">
            {recent.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <span className="text-xs text-muted-foreground">{fmtDateTime(e.timestamp)}</span>
                <p>
                  <span className="font-medium">{e.activityType}</span> — {e.description}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        Security posture report generated for MSP compliance and review.
      </p>
    </div>
  );
}
