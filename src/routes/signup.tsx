import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/gie/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerDemoAccount } from "@/lib/demo-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Guardrail Intelligence Engine" },
      { name: "description", content: "Create an account for the GIE MSP console." },
      { property: "og:title", content: "Create account — Guardrail Intelligence Engine" },
      {
        property: "og:description",
        content: "Create an account for the GIE MSP console.",
      },
    ],
  }),
  component: SignupPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignupPage() {
  const navigate = useNavigate();
  const [f, setF] = useState({
    fullName: "",
    organisationName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f | "confirm", string>>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const e: Partial<Record<keyof typeof f, string>> = {};
    if (!f.fullName.trim()) e.fullName = "Full name is required.";
    if (!f.organisationName.trim()) e.organisationName = "Organisation name is required.";
    if (!f.email.trim()) e.email = "Email address is required.";
    else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
    if (!f.password) e.password = "Password is required.";
    else if (f.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (f.confirm !== f.password) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await registerDemoAccount({
        fullName: f.fullName,
        organisationName: f.organisationName,
        email: f.email,
        passcode: f.password,
      });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 1600);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  const field = (k: keyof typeof f, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type={type}
        autoComplete="off"
        value={f[k]}
        onChange={set(k)}
        placeholder={placeholder}
        aria-invalid={!!errors[k]}
      />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthShell title="Create account" subtitle="Register an MSP user.">
      {success ? (
        <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
          <CheckCircle2 className="size-5 text-success" />
          <div>
            <p className="font-medium">Account created.</p>
            <p className="text-muted-foreground">Redirecting you to sign in…</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {field("fullName", "Full Name", "text", "Alex Taylor")}
          {field("organisationName", "MSP Organisation Name", "text", "Franklin Cyber Care")}
          {field("email", "Email Address", "email", "name@example.com")}

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={f.password}
                onChange={set("password")}
                className="pr-10"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={f.confirm}
                onChange={set("confirm")}
                className="pr-10"
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirm}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>

          {formError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />} Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
