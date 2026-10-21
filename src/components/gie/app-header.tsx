import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDemoAuth } from "@/lib/demo-auth";
import { NAV } from "./app-sidebar";

function titleFor(path: string) {
  if (/^\/clients\/[^/]+\/report/.test(path)) return "Client Security Report";
  if (/^\/clients\/[^/]+/.test(path)) return "Client Details";
  return NAV.find((n) => path.startsWith(n.url))?.title ?? "GIE";
}

export function AppHeader() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { session, signOut } = useDemoAuth();
  const navigate = useNavigate();
  const initials = (session?.fullName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const logout = () => {
    signOut();
    navigate({ to: "/login" });
  };
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur print:hidden">
      <SidebarTrigger />
      <h2 className="truncate text-sm font-semibold">{titleFor(path)}</h2>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session?.organisationName}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile menu">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{session?.fullName}</p>
              <p className="text-xs font-normal text-muted-foreground">{session?.email}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {session?.organisationName}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={logout} className="hidden md:inline-flex">
          <LogOut className="size-4" /> Logout
        </Button>
      </div>
    </header>
  );
}
