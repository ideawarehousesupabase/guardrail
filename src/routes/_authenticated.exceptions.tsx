import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, FilePlus2, Hourglass, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Mono,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  fmtDate,
} from "@/components/gie/ui-bits";
import { useGie } from "@/state/gie-store";
import { useClientName } from "@/lib/selectors";
import { effectiveExceptionStatus } from "@/lib/engine";
import type { Severity } from "@/data/types";

type ExSearch = {
  client?: string | undefined;
  create?: boolean | undefined;
  finding?: string | undefined;
  guardrail?: string | undefined;
  view?: string | undefined;
};
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/_authenticated/exceptions")({
  validateSearch: (s: Record<string, unknown>): ExSearch => ({
    client: str(s["client"]),
    create: s["create"] === true || s["create"] === "true" ? true : undefined,
    finding: str(s["finding"]),
    guardrail: str(s["guardrail"]),
    view: str(s["view"]),
  }),
  head: () => ({
    meta: [
      { title: "Exception Governance — GIE" },
      {
        name: "description",
        content: "Structured management of temporary deviations from security guardrails.",
      },
      { property: "og:title", content: "Exception Governance — GIE" },
      {
        property: "og:description",
        content: "Structured management of temporary deviations from security guardrails.",
      },
    ],
  }),
  component: ExceptionsPage,
});

const emptyForm = {
  clientId: "",
  guardrailId: "",
  findingId: "none",
  reason: "",
  riskRating: "Medium" as Severity,
  owner: "",
  compensatingControls: "",
  expiryDate: "",
  reviewDate: "",
};

function ExceptionsPage() {
  const store = useGie();
  const { exceptions, guardrails, findings, clients } = store;
  const name = useClientName();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/exceptions" });
  const setSearch = (p: Partial<ExSearch>) =>
    navigate({ search: (prev: ExSearch) => ({ ...prev, ...p }), replace: true });

  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (search.create) {
      const f = search.finding ? findings.find((x) => x.id === search.finding) : undefined;
      const cId = search.client ?? f?.clientId ?? clients[0]?.id ?? "";
      const gId = search.guardrail ?? f?.guardrailId ?? "";
      const sev = (f?.severity ?? "Medium") as Severity;

      const today = new Date();
      const defaultReview = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
      const defaultExpiry = new Date(today.getTime() + 90 * 86400000).toISOString().slice(0, 10);

      setForm({
        ...emptyForm,
        clientId: cId,
        guardrailId: gId,
        findingId: search.finding ?? "none",
        riskRating: sev,
        reviewDate: defaultReview,
        expiryDate: defaultExpiry,
      });
      setErr("");
    }
  }, [search.create, search.client, search.guardrail, search.finding, clients, findings]);

  const control = (id: string) => guardrails.find((g) => g.id === id)?.name ?? id;
  const rows = exceptions
    .filter((e) => !search.client || e.clientId === search.client)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const st = rows.map((e) => effectiveExceptionStatus(e));
  const sel = exceptions.find((e) => e.id === search.view);

  const closeForm = () =>
    setSearch({ create: undefined, finding: undefined, guardrail: undefined });
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const required = [
      form.clientId,
      form.guardrailId,
      form.reason.trim(),
      form.owner.trim(),
      form.compensatingControls.trim(),
      form.expiryDate,
      form.reviewDate,
    ];
    if (required.some((v) => !v)) return setErr("Please complete all required fields.");
    if (form.reviewDate > form.expiryDate)
      return setErr("Review date must be on or before the expiry date.");
    const id = store.createException({
      ...form,
      findingId: form.findingId === "none" ? undefined : form.findingId,
    });
    toast.success("Exception submitted", {
      description: `${id || "New exception"} is pending approval.`,
    });
    navigate({ search: { client: search.client }, replace: true });
  };

  const act = (fn: (id: string) => void, id: string, msg: string) => {
    fn(id);
    toast.success(`${id} ${msg}`, { description: "Evidence record created." });
  };

  const clientGuardrails = guardrails.filter((g) => g.clientId === form.clientId);
  const clientFindings = findings.filter(
    (f) =>
      f.clientId === form.clientId &&
      (f.status === "Open" || f.id === form.findingId) &&
      (!form.guardrailId || f.guardrailId === form.guardrailId),
  );

  return (
    <>
      <PageHeader
        title="Exception Governance"
        description="Temporary, owned and time-bound deviations from agreed guardrails."
        actions={
          <Button onClick={() => setSearch({ create: true })}>
            <FilePlus2 className="size-4" /> Create Exception
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Exceptions" value={rows.length} icon={AlertTriangle} />
        <StatCard
          label="Pending Approval"
          value={st.filter((s) => s === "Pending").length}
          icon={Hourglass}
        />
        <StatCard
          label="Active Exceptions"
          value={st.filter((s) => s === "Active").length}
          icon={CheckCircle2}
          tone="teal"
        />
        <StatCard
          label="Expired Exceptions"
          value={st.filter((s) => s === "Expired").length}
          icon={Clock}
          tone="critical"
        />
      </div>
      <div className="my-4">
        <ClientSelector
          value={search.client ?? "all"}
          onChange={(v) => setSearch({ client: v === "all" ? undefined : v })}
        />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="No exceptions for this selection" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 whitespace-nowrap min-w-[120px]">
                    Exception ID
                  </TableHead>
                  <TableHead className="whitespace-nowrap min-w-[140px]">Client</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[160px]">
                    Related Security Control
                  </TableHead>
                  <TableHead className="whitespace-nowrap min-w-[110px]">Risk Rating</TableHead>
                  <TableHead className="min-w-40">Owner</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[130px]">Approval Status</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">Expiry Date</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">Current Status</TableHead>
                  <TableHead className="pr-5 text-right whitespace-nowrap min-w-[90px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-5 whitespace-nowrap">
                      <Mono>{e.id}</Mono>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {name(e.clientId)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{control(e.guardrailId)}</TableCell>
                    <TableCell>
                      <StatusBadge status={e.riskRating} />
                    </TableCell>
                    <TableCell className="min-w-40 text-sm">{e.owner}</TableCell>
                    <TableCell>
                      <StatusBadge status={e.approvalStatus} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {fmtDate(e.expiryDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={st[i] ?? ""} />
                    </TableCell>
                    <TableCell className="pr-5 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => setSearch({ view: e.id })}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      {/* Exception details */}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSearch({ view: undefined })}>
        <DialogContent className="sm:max-w-xl">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>Exception {sel.id}</DialogTitle>
                <DialogDescription>{sel.reason}</DialogDescription>
              </DialogHeader>
              <dl className="divide-y">
                <DetailRow label="Client">{name(sel.clientId)}</DetailRow>
                <DetailRow label="Guardrail">{control(sel.guardrailId)}</DetailRow>
                <DetailRow label="Related finding">{sel.findingId ?? "—"}</DetailRow>
                <DetailRow label="Risk rating">
                  <StatusBadge status={sel.riskRating} />
                </DetailRow>
                <DetailRow label="Owner">{sel.owner}</DetailRow>
                <DetailRow label="Compensating controls">{sel.compensatingControls}</DetailRow>
                <DetailRow label="Review date">{fmtDate(sel.reviewDate)}</DetailRow>
                <DetailRow label="Expiry date">{fmtDate(sel.expiryDate)}</DetailRow>
                <DetailRow label="Approval">
                  <StatusBadge status={sel.approvalStatus} />
                </DetailRow>
                <DetailRow label="Current status">
                  <StatusBadge status={effectiveExceptionStatus(sel)} />
                </DetailRow>
              </dl>
              <DialogFooter className="gap-2">
                {sel.currentStatus === "Pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => act(store.rejectException, sel.id, "rejected")}
                    >
                      <XCircle className="size-4" /> Reject
                    </Button>
                    <Button onClick={() => act(store.approveException, sel.id, "approved")}>
                      <CheckCircle2 className="size-4" /> Approve
                    </Button>
                  </>
                )}
                {(sel.currentStatus === "Active" ||
                  effectiveExceptionStatus(sel) === "Expired") && (
                  <Button
                    variant="outline"
                    onClick={() => act(store.closeException, sel.id, "closed")}
                  >
                    Close Exception
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create exception */}
      <Dialog open={!!search.create} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Exception</DialogTitle>
            <DialogDescription>New exceptions start as Pending Approval.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <ClientSelector
                  allowAll={false}
                  value={form.clientId}
                  onChange={(v) =>
                    setForm({ ...form, clientId: v, guardrailId: "", findingId: "none" })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Security Guardrail</Label>
                <Select
                  value={form.guardrailId}
                  onValueChange={(v) => setForm({ ...form, guardrailId: v, findingId: "none" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select guardrail" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientGuardrails.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Related Finding (optional)</Label>
              <Select
                value={form.findingId}
                onValueChange={(v) => setForm({ ...form, findingId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clientFindings.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.id} · {f.control} ({f.severity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Exception Reason</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Risk Rating</Label>
                <Select
                  value={form.riskRating}
                  onValueChange={(v) => setForm({ ...form, riskRating: v as Severity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Critical", "High", "Medium", "Low"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="owner">Exception Owner</Label>
                <Input
                  id="owner"
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comp">Compensating Controls</Label>
              <Textarea
                id="comp"
                value={form.compensatingControls}
                onChange={(e) => setForm({ ...form, compensatingControls: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review">Review Date</Label>
                <Input
                  id="review"
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                />
              </div>
            </div>
            {err && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {err}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit">Submit for Approval</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
