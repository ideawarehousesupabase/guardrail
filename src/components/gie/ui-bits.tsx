import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGie } from "@/state/gie-store";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const toneMap = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-teal/12 text-teal",
  critical: "bg-critical/10 text-critical",
  high: "bg-high/12 text-high",
  success: "bg-success/12 text-success",
  neutral: "bg-muted text-muted-foreground",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof toneMap;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-lg", toneMap[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const pill =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium";
const badgeTone: Record<string, string> = {
  Critical: "border-critical/30 bg-critical/10 text-critical",
  High: "border-high/30 bg-high/10 text-high",
  Medium: "border-medium/40 bg-medium/15 text-foreground",
  Low: "border-low/30 bg-low/10 text-low",
  Compliant: "border-success/30 bg-success/10 text-success",
  Resolved: "border-success/30 bg-success/10 text-success",
  Approved: "border-success/30 bg-success/10 text-success",
  Active: "border-teal/30 bg-teal/10 text-teal",
  "Minor Drift": "border-medium/40 bg-medium/15 text-foreground",
  Drift: "border-high/30 bg-high/10 text-high",
  "At Risk": "border-high/30 bg-high/10 text-high",
  Open: "border-high/30 bg-high/10 text-high",
  Pending: "border-primary/30 bg-primary/10 text-primary",
  "Pending Approval": "border-primary/30 bg-primary/10 text-primary",
  Expired: "border-critical/30 bg-critical/10 text-critical",
  Rejected: "border-neutral/30 bg-muted text-muted-foreground",
  Closed: "border-neutral/30 bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(pill, badgeTone[status] ?? "border-border bg-muted text-muted-foreground")}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
export const SeverityBadge = ({ severity }: { severity: string }) => (
  <StatusBadge status={severity} />
);

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground/60" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-card pl-9"
      />
    </div>
  );
}

export function FilterDropdown({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-card sm:w-48" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ClientSelector({
  value,
  onChange,
  allowAll = true,
}: {
  value: string;
  onChange: (v: string) => void;
  allowAll?: boolean;
}) {
  const { clients } = useGie();
  const opts = clients.map((c) => ({ value: c.id, label: c.name }));
  if (allowAll)
    return <FilterDropdown value={value} onChange={onChange} options={opts} label="Clients" />;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-card sm:w-64" aria-label="Client">
        <SelectValue placeholder="Select a client" />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </div>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const Mono = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-xs text-muted-foreground">{children}</span>
);
