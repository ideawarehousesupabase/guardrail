import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, ShieldX, Siren, Waypoints, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  StatCard,
  StatusBadge,
  fmtDate,
  fmtDateTime,
} from "@/components/gie/ui-bits";
import { useGie } from "@/state/gie-store";
import { useClientName, useFindingStats } from "@/lib/selectors";

type DriftSearch = {
  client?: string | undefined;
  severity?: string | undefined;
  status?: string | undefined;
  finding?: string | undefined;
};
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/_authenticated/drift")({
  validateSearch: (s: Record<string, unknown>): DriftSearch => ({
    client: str(s["client"]),
    severity: str(s["severity"]),
    status: str(s["status"]),
    finding: str(s["finding"]),
  }),
  head: () => ({
    meta: [
      { title: "Drift Monitoring — GIE" },
      {
        name: "description",
        content: "Configurations that deviate from agreed customer security guardrails.",
      },
      { property: "og:title", content: "Drift Monitoring — GIE" },
      {
        property: "og:description",
        content: "Configurations that deviate from agreed customer security guardrails.",
      },
    ],
  }),
  component: DriftPage,
});

function DriftPage() {
  const { findings, resolveFinding } = useGie();
  const name = useClientName();
  const search = Route.useSearch();
  const scopeStats = useFindingStats(search.client);
  const navigate = useNavigate({ from: "/drift" });
  const setSearch = (patch: Partial<DriftSearch>) =>
    navigate({ search: (prev: DriftSearch) => ({ ...prev, ...patch }), replace: true });
  const f = (k: keyof DriftSearch) => search[k] ?? "all";
  const set = (k: keyof DriftSearch) => (v: string) =>
    setSearch({ [k]: v === "all" ? undefined : v });

  const rows = findings
    .filter(
      (x) =>
        (!search.client || x.clientId === search.client) &&
        (!search.severity || x.severity === search.severity) &&
        (!search.status || x.status === search.status),
    )
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  const selected = findings.find((x) => x.id === search.finding);

  return (
    <>
      <PageHeader
        title="Drift Monitoring"
        description="Simulated comparison of current mock configurations against each client's accepted guardrails."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Open Findings"
          value={scopeStats.open}
          icon={ShieldAlert}
          tone="high"
          hint="Active drift"
        />
        <StatCard
          label="Critical"
          value={scopeStats.critical}
          icon={Siren}
          tone="critical"
          hint="Open"
        />
        <StatCard label="High" value={scopeStats.high} icon={ShieldAlert} tone="high" hint="Open" />
        <StatCard
          label="Medium"
          value={scopeStats.medium}
          icon={Waypoints}
          tone="teal"
          hint="Open"
        />
        <StatCard label="Low" value={scopeStats.low} icon={Waypoints} tone="neutral" hint="Open" />
        <StatCard
          label="Resolved"
          value={scopeStats.resolved}
          icon={CheckCircle2}
          tone="success"
          hint="Remediated"
        />
      </div>
      <div className="my-4 flex flex-col gap-2 sm:flex-row">
        <ClientSelector value={f("client")} onChange={set("client")} />
        <FilterDropdown
          label="Severities"
          value={f("severity")}
          onChange={set("severity")}
          options={["Critical", "High", "Medium", "Low"].map((v) => ({ value: v, label: v }))}
        />
        <FilterDropdown
          label="Statuses"
          value={f("status")}
          onChange={set("status")}
          options={["Open", "Resolved"].map((v) => ({ value: v, label: v }))}
        />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="No findings match these filters" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Finding ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Security Control</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Expected Configuration</TableHead>
                  <TableHead>Current Configuration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detected Date</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="pl-5">
                      <Mono>{x.id}</Mono>
                    </TableCell>
                    <TableCell className="font-medium">{name(x.clientId)}</TableCell>
                    <TableCell>{x.control}</TableCell>
                    <TableCell>
                      <StatusBadge status={x.severity} />
                    </TableCell>
                    <TableCell className="max-w-52 text-xs">{x.expectedValue}</TableCell>
                    <TableCell className="max-w-52 text-xs text-muted-foreground">
                      {x.currentValue}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={x.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {fmtDate(x.detectedAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSearch({ finding: x.id })}
                      >
                        View Finding
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSearch({ finding: undefined })}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldX className="size-5 text-high" /> Finding {selected.id}
                </DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <dl className="divide-y">
                <DetailRow label="Customer">{name(selected.clientId)}</DetailRow>
                <DetailRow label="Security control">{selected.control}</DetailRow>
                <DetailRow label="Expected">{selected.expectedValue}</DetailRow>
                <DetailRow label="Observed">{selected.currentValue}</DetailRow>
                <DetailRow label="Severity">
                  <StatusBadge status={selected.severity} />
                </DetailRow>
                <DetailRow label="Detected">{fmtDateTime(selected.detectedAt)}</DetailRow>
                <DetailRow label="Status">
                  <StatusBadge status={selected.status} />
                  {selected.resolvedAt && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {fmtDateTime(selected.resolvedAt)}
                    </span>
                  )}
                </DetailRow>
              </dl>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/exceptions",
                      search: {
                        client: selected.clientId,
                        create: true,
                        finding: selected.id,
                        guardrail: selected.guardrailId,
                      },
                    })
                  }
                >
                  <FilePlus2 className="size-4" /> Create Exception
                </Button>
                <Button
                  disabled={selected.status === "Resolved"}
                  onClick={() => {
                    resolveFinding(selected.id);
                    toast.success(`${selected.id} marked as resolved`, {
                      description: "Simulated remediation recorded in the Evidence Ledger.",
                    });
                  }}
                >
                  <CheckCircle2 className="size-4" /> Mark as Resolved
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
