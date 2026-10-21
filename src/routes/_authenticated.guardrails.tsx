import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientSelector, PageHeader, Panel, StatusBadge, fmtDate } from "@/components/gie/ui-bits";
import { useGie } from "@/state/gie-store";
import { generateGuardrails } from "@/lib/engine";
import type { Guardrail } from "@/data/types";

export const Route = createFileRoute("/_authenticated/guardrails")({
  validateSearch: (s: Record<string, unknown>): { client?: string | undefined } => ({
    client: typeof s["client"] === "string" ? s["client"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Guardrail Composer — GIE" },
      {
        name: "description",
        content: "Generate customer-specific recommended security guardrails.",
      },
      { property: "og:title", content: "Guardrail Composer — GIE" },
      {
        property: "og:description",
        content: "Generate customer-specific recommended security guardrails.",
      },
    ],
  }),
  component: Composer,
});

function Composer() {
  const { clients, guardrails, acceptGuardrails } = useGie();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/guardrails" });
  const client = clients.find((c) => c.id === search.client) ?? clients[0]!;
  const [recs, setRecs] = useState<{ clientId: string; items: Guardrail[] } | null>(null);
  const current = guardrails.filter((g) => g.clientId === client.id);
  const proposal = recs?.clientId === client.id ? recs.items : null;

  const accept = () => {
    if (!proposal) return;
    acceptGuardrails(client.id, proposal);
    setRecs(null);
    toast.success(`Guardrails accepted for ${client.name}`, {
      description: "Drift re-evaluated and evidence recorded.",
    });
  };

  const shown = proposal ?? current;

  return (
    <>
      <PageHeader
        title="Guardrail Composer"
        description="Recommends a customer-specific security baseline from the client's profile using predefined business rules."
        actions={
          <ClientSelector
            allowAll={false}
            value={client.id}
            onChange={(v) => {
              setRecs(null);
              navigate({ search: { client: v } });
            }}
          />
        }
      />

      <Panel title="Client security context">
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Industry", client.industry],
            ["Organisation size", `${client.userCount} users`],
            ["Service tier", client.serviceTier],
            ["Security maturity", client.securityMaturity],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="mt-0.5 text-sm font-medium">{v}</p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-muted-foreground">Historical issues</p>
            <ul className="mt-0.5 space-y-1 text-sm">
              {client.historicalIssues.map((h) => (
                <li key={h}>· {h}</li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      {/* Action Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setRecs({ clientId: client.id, items: generateGuardrails(client) })}
          >
            <Sparkles className="size-4" /> Generate Recommended Guardrails
          </Button>
          {proposal && (
            <>
              <Button variant="default" className="bg-primary" onClick={accept}>
                <CheckCircle2 className="size-4" /> Accept Guardrails
              </Button>
              <Button variant="outline" onClick={() => setRecs(null)}>
                Discard Proposal
              </Button>
            </>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          {proposal
            ? "Proposed baseline is staged for review. Accepted guardrails will not change until you click 'Accept Guardrails'."
            : `Active baseline last agreed on ${fmtDate(current[0]?.acceptedAt ?? new Date().toISOString())}.`}
        </p>
      </div>

      {/* Proposed Baseline Section (when active) */}
      {proposal && (
        <section className="mt-6 space-y-4 rounded-xl border-2 border-primary/40 bg-primary/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-primary">Proposed Security Baseline</h2>
                <StatusBadge status="Pending" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Simulated recommendations derived from client risk profile. Click Accept Guardrails
                to commit this baseline.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={accept}>
                <CheckCircle2 className="size-4" /> Accept Baseline
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRecs(null)}>
                Discard
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {proposal.map((g) => {
              const prev = current.find((c) => c.category === g.category);
              const changed = prev && prev.expectedLevel !== g.expectedLevel;
              return (
                <article
                  key={g.id}
                  className="rounded-xl border border-primary/30 bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{g.name}</h3>
                    <StatusBadge status={g.status} />
                  </div>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Proposed configuration</dt>
                      <dd className="font-medium text-primary">{g.expectedValue}</dd>
                      {changed && (
                        <dd className="text-xs text-muted-foreground">
                          Previously agreed: {prev.expectedValue}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Current configuration</dt>
                      <dd>{g.currentValue}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Recommendation rationale</dt>
                      <dd className="text-muted-foreground">{g.justification}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Currently Accepted Baseline Section */}
      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Currently Accepted Baseline</h2>
              <StatusBadge status="Approved" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Agreed security controls currently enforced for {client.name} (Accepted:{" "}
              {fmtDate(current[0]?.acceptedAt ?? new Date().toISOString())}).
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {current.map((g) => (
            <article key={g.id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{g.name}</h3>
                <StatusBadge status={g.status} />
              </div>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Agreed baseline configuration</dt>
                  <dd className="font-medium">{g.expectedValue}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Current configuration</dt>
                  <dd className="text-muted-foreground">{g.currentValue}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Baseline justification</dt>
                  <dd className="text-muted-foreground">{g.justification}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-6 text-sm text-muted-foreground">
        After accepting, review deviations in{" "}
        <Link
          to="/drift"
          search={{ client: client.id }}
          className="font-medium text-primary hover:underline"
        >
          Drift Monitoring
        </Link>
        .
      </p>
    </>
  );
}
