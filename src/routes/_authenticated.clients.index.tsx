import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  FilterDropdown,
  PageHeader,
  Panel,
  SearchInput,
  StatusBadge,
} from "@/components/gie/ui-bits";
import { useClientSummaries } from "@/lib/selectors";

export const Route = createFileRoute("/_authenticated/clients/")({
  head: () => ({
    meta: [
      { title: "Managed Clients — GIE" },
      { name: "description", content: "All SME client environments managed by the MSP." },
      { property: "og:title", content: "Managed Clients — GIE" },
      { property: "og:description", content: "All SME client environments managed by the MSP." },
    ],
  }),
  component: ClientsPage,
});

const STATUSES = ["Compliant", "Minor Drift", "At Risk", "Critical"];

function ClientsPage() {
  const rows = useClientSummaries();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = rows.filter(
    (r) =>
      r.client.name.toLowerCase().includes(q.toLowerCase()) &&
      (status === "all" || r.status === status),
  );
  return (
    <>
      <PageHeader
        title="Managed Clients"
        description="SME customer environments under management (simulated Microsoft 365 tenants)."
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={q} onChange={setQ} placeholder="Search by client name" />
        <FilterDropdown
          value={status}
          onChange={setStatus}
          label="Statuses"
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </div>
      <Panel>
        {filtered.length === 0 ? (
          <EmptyState
            title="No clients match your search"
            description="Try a different name or status filter."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Client Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="text-right">Number of Users</TableHead>
                <TableHead>Service Tier</TableHead>
                <TableHead>Security Status</TableHead>
                <TableHead className="text-right">Open Findings</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.client.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/clients/$clientId", params: { clientId: r.client.id } })
                  }
                >
                  <TableCell className="pl-5 font-medium">{r.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.client.industry}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.client.userCount}</TableCell>
                  <TableCell>{r.client.serviceTier}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.openFindings.length}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to="/clients/$clientId" params={{ clientId: r.client.id }}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
