import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FileText, ShieldCheck, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  Mono,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  fmtDate,
} from "@/components/gie/ui-bits";
import { useClientSummaries } from "@/lib/selectors";
import { effectiveExceptionStatus } from "@/lib/engine";
import { CONTROL_BY_KEY } from "@/data/controls";

export const Route = createFileRoute("/_authenticated/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "Client Details — GIE" },
      { name: "description", content: "Security overview of a managed client." },
      { property: "og:title", content: "Client Details — GIE" },
      { property: "og:description", content: "Security overview of a managed client." },
    ],
  }),
  component: ClientDetails,
});

function ClientDetails() {
  const { clientId } = Route.useParams();
  const s = useClientSummaries().find((x) => x.client.id === clientId);
  if (!s)
    return (
      <EmptyState
        title="Client not found"
        description="Return to Managed Clients to choose a client."
      />
    );
  const { client, guardrails, openFindings, openExceptions, status } = s;
  const compliant = guardrails.filter((g) => g.status === "Compliant").length;
  const search = { client: clientId };

  return (
    <>
      <PageHeader
        title={client.name}
        description={`${client.industry} · ${client.userCount} users · ${client.serviceTier} tier`}
        actions={
          <>
            <StatusBadge status={status} />
            <Button asChild variant="outline" size="sm">
              <Link to="/guardrails" search={search}>
                <ShieldCheck className="size-4" />
                View Guardrails
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/drift" search={search}>
                <Waypoints className="size-4" />
                View Drift Findings
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/evidence" search={search}>
                <CheckCircle2 className="size-4" />
                View Evidence
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/exceptions" search={search}>
                <AlertTriangle className="size-4" />
                Manage Exceptions
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/clients/$clientId/report" params={{ clientId }}>
                <FileText className="size-4" />
                Security Report
              </Link>
            </Button>
          </>
        }
      />
      <p className="-mt-3 mb-6 text-xs text-muted-foreground">{client.m365Summary}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned Guardrails" value={guardrails.length} icon={ShieldCheck} />
        <StatCard
          label="Compliant Controls"
          value={`${compliant}/${guardrails.length}`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Active Drift Findings"
          value={openFindings.length}
          icon={Waypoints}
          tone="high"
        />
        <StatCard
          label="Open Exceptions"
          value={openExceptions.length}
          icon={AlertTriangle}
          tone="teal"
        />
      </div>

      <Panel title="Guardrail Status" className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Security Control</TableHead>
              <TableHead>Expected Configuration</TableHead>
              <TableHead>Current Configuration</TableHead>
              <TableHead className="pr-5">Compliance Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardrails.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="pl-5 font-medium">
                  {CONTROL_BY_KEY[g.category].name}
                </TableCell>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Active Security Findings">
          {openFindings.length === 0 ? (
            <EmptyState title="No open findings" />
          ) : (
            <ul className="divide-y">
              {openFindings.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <Link
                    to="/drift"
                    search={{ finding: f.id }}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {f.id}
                  </Link>
                  <span className="flex-1 text-sm">{f.control}</span>
                  <StatusBadge status={f.severity} />
                  <StatusBadge status={f.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Related Exceptions">
          {openExceptions.length === 0 ? (
            <EmptyState title="No active or pending exceptions" />
          ) : (
            <ul className="divide-y">
              {openExceptions.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <Mono>{e.id}</Mono>
                  <span className="flex-1 text-sm">
                    {guardrails.find((g) => g.id === e.guardrailId)?.name ?? e.guardrailId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Expires {fmtDate(e.expiryDate)}
                  </span>
                  <StatusBadge status={effectiveExceptionStatus(e)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
