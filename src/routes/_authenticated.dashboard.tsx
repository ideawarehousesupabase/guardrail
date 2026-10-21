import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Building2, ShieldAlert, Waypoints } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  fmtDateTime,
  Mono,
} from "@/components/gie/ui-bits";
import { useGie } from "@/state/gie-store";
import { useClientName, useClientSummaries, useFindingStats } from "@/lib/selectors";
import { effectiveExceptionStatus } from "@/lib/engine";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "MSP Dashboard — GIE" },
      { name: "description", content: "Overview of security delivery across managed SME clients." },
      { property: "og:title", content: "MSP Dashboard — GIE" },
      {
        property: "og:description",
        content: "Overview of security delivery across managed SME clients.",
      },
    ],
  }),
  component: Dashboard,
});

const SEV_COLOR: Record<string, string> = {
  Critical: "var(--critical)",
  High: "var(--high)",
  Medium: "var(--medium)",
  Low: "var(--low)",
};

function Dashboard() {
  const { exceptions, evidence } = useGie();
  const summaries = useClientSummaries();
  const stats = useFindingStats();
  const name = useClientName();
  const openEx = exceptions.filter((e) =>
    ["Pending", "Active"].includes(effectiveExceptionStatus(e)),
  );
  const drifting = summaries.filter((s) => s.openFindings.length > 0).length;
  const chart = stats.bySeverity.map((s) => ({ severity: s.severity, count: s.openCount }));
  const recent = [...evidence].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 7);

  return (
    <>
      <PageHeader
        title="MSP Dashboard"
        description="Security delivery across your managed SME clients. All figures are calculated from simulated data."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Managed Clients" value={summaries.length} icon={Building2} />
        <StatCard
          label="Active Security Findings"
          value={stats.open}
          icon={ShieldAlert}
          tone="critical"
          hint={`Resolved: ${stats.resolved}`}
        />
        <StatCard
          label="Clients with Security Drift"
          value={drifting}
          icon={Waypoints}
          tone="high"
        />
        <StatCard
          label="Open Security Exceptions"
          value={openEx.length}
          icon={AlertTriangle}
          tone="teal"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Client Security Overview" className="xl:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Client Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Security Status</TableHead>
                <TableHead className="text-right">Open Findings</TableHead>
                <TableHead className="text-right">Open Exceptions</TableHead>
                <TableHead className="pr-5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => (
                <TableRow key={s.client.id}>
                  <TableCell className="pl-5 font-medium">{s.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.client.industry}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.openFindings.length}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.openExceptions.length}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/clients/$clientId" params={{ clientId: s.client.id }}>
                        View Client
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Security Findings by Severity">
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="severity" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={28}
                />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chart.map((c) => (
                    <Cell key={c.severity} fill={SEV_COLOR[c.severity]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 divide-x border-t text-center text-xs">
            <div className="py-2.5 px-2">
              <p className="text-muted-foreground">Critical / High</p>
              <p className="font-semibold text-critical">
                {stats.critical} <span className="text-high">/ {stats.high}</span>
              </p>
            </div>
            <div className="py-2.5 px-2">
              <p className="text-muted-foreground">Medium / Low</p>
              <p className="font-semibold">
                {stats.medium} / {stats.low}
              </p>
            </div>
            <div className="py-2.5 px-2">
              <p className="text-muted-foreground">Open / Resolved</p>
              <p className="font-semibold text-primary">
                {stats.open} <span className="text-success">/ {stats.resolved}</span>
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent Security Activity"
        className="mt-6"
        action={
          <Link to="/evidence" className="text-xs font-medium text-primary hover:underline">
            Open Evidence Ledger
          </Link>
        }
      >
        <ul className="divide-y">
          {recent.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="w-40 shrink-0 text-xs text-muted-foreground">
                {fmtDateTime(e.timestamp)}
              </span>
              <span className="w-36 shrink-0 text-xs font-medium text-primary">
                {e.activityType}
              </span>
              <span className="flex-1 text-sm">
                <span className="font-medium">{name(e.clientId)}</span> — {e.description}
              </span>
              {e.relatedFindingId ? (
                <Link
                  to="/drift"
                  search={{ finding: e.relatedFindingId }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {e.relatedFindingId}
                </Link>
              ) : (
                <Mono>{e.id}</Mono>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
