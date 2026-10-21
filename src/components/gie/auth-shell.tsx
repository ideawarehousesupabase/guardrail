import type { ReactNode } from "react";
import { Info, ShieldHalf } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldHalf className="size-5" />
          </span>
          <span className="font-semibold text-sidebar-accent-foreground">
            Guardrail Intelligence Engine
          </span>
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-sidebar-accent-foreground">
            Customer-specific security guardrails for every SME you manage.
          </h2>
          <ul className="mt-6 space-y-2 text-sm">
            <li>· Compose baselines per client profile</li>
            <li>· Detect drift from agreed configurations</li>
            <li>· Govern exceptions with expiry and ownership</li>
            <li>· Capture evidence by default</li>
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Franklin · Year 1 demonstration MVP</p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-4 flex gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Non-production prototype. This demonstration account flow is{" "}
              <strong>not secure authentication</strong>. Do not use a real password or real
              personal data.
            </p>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
