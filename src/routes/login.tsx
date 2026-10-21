import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/gie/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoAuth } from "@/lib/demo-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Guardrail Intelligence Engine" },
      { name: "description", content: "Sign in to the GIE demonstration MSP console." },
      { property: "og:title", content: "Sign in — Guardrail Intelligence Engine" },
      { property: "og:description", content: "Sign in to the GIE demonstration MSP console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, session, ready } = useDemoAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && session) navigate({ to: "/dashboard" });
  }, [ready, session, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !pass)
      return setError("Please enter your email address and demo passcode.");
    setLoading(true);
    try {
      await signIn(email, pass);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access the demonstration MSP console.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pass">Demo Passcode</Label>
          <div className="relative">
            <Input
              id="pass"
              type={show ? "text" : "password"}
              autoComplete="off"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              aria-label={show ? "Hide passcode" : "Show passcode"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} Sign in
        </Button>
        <div className="flex flex-col items-center gap-2 pt-1 text-center text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setEmail("demo@franklin-msp.co.uk");
              setPass("Demonstration123!");
            }}
            className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
          >
            Fill demonstration credentials
          </button>
          <span>or create a new demonstration account below</span>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          No demo account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
