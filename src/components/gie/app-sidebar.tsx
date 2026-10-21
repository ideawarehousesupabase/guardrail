import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  FileCheck2,
  LayoutDashboard,
  ShieldCheck,
  ShieldHalf,
  Waypoints,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const NAV = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Managed Clients", url: "/clients", icon: Building2 },
  { title: "Guardrail Composer", url: "/guardrails", icon: ShieldCheck },
  { title: "Drift Monitoring", url: "/drift", icon: Waypoints },
  { title: "Evidence Ledger", url: "/evidence", icon: FileCheck2 },
  { title: "Exception Governance", url: "/exceptions", icon: AlertTriangle },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldHalf className="size-4.5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-sidebar-accent-foreground">Guardrail IE</p>
            <p className="text-[11px] text-sidebar-foreground/70">Franklin · MSP Console</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Security delivery
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={path === item.url || path.startsWith(item.url + "/")}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="rounded-md bg-sidebar-accent px-3 py-2 text-[11px] leading-snug text-sidebar-foreground/80">
          Demonstration MVP — all security data is simulated.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
