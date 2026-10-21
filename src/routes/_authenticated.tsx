import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/gie/app-sidebar";
import { AppHeader } from "@/components/gie/app-header";
import { LoadingState } from "@/components/gie/ui-bits";
import { useDemoAuth } from "@/lib/demo-auth";

// Demonstration navigation guard only — not an enforceable security control.
export const Route = createFileRoute("/_authenticated")({
  component: AppLayout,
});

function AppLayout() {
  const { session, ready } = useDemoAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !session) navigate({ to: "/login" });
  }, [ready, session, navigate]);

  if (!ready || !session) return <LoadingState />;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
