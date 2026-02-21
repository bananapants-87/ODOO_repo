import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFleet } from "@/lib/fleet-store";
import { UserRole } from "@/lib/fleet-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, AlertCircle } from "lucide-react";
import { z } from "zod";

const API = "http://127.0.0.1:8000/api";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "Manager", label: "Fleet Manager", desc: "Full access to all modules" },
  { value: "Dispatcher", label: "Dispatcher", desc: "Trip creation & assignment" },
  { value: "Safety Officer", label: "Safety Officer", desc: "Driver compliance & safety" },
  { value: "Analyst", label: "Financial Analyst", desc: "Reports & cost analysis" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Manager");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login } = useFleet();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      const response = await fetch(`${API}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        alert("Backend rejected request");
        return;
      }

      const data = await response.json();
      console.log("API RESPONSE:", data);

      login(email, password, role);
      navigate("/dashboard");

    } catch (err) {
      console.error("Network error:", err);
      alert("Cannot connect to backend");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL — SAME AS YOUR UI */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">FleetFlow</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Modular Fleet &<br />
            <span className="text-gradient-primary">Logistics Management</span>
          </h1>
          <p className="max-w-md text-muted-foreground leading-relaxed">
            Replace inefficient manual logbooks with a centralized, rule-based digital hub.
          </p>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground">
          <div><span className="text-2xl font-bold text-foreground">8</span><br />Vehicles Tracked</div>
          <div><span className="text-2xl font-bold text-foreground">6</span><br />Active Drivers</div>
          <div><span className="text-2xl font-bold text-foreground">99.2%</span><br />Uptime</div>
        </div>
      </div>

      {/* RIGHT PANEL — FORM */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your fleet management account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" /> {errors.password}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <button
                  type="button"
                  key={r.value}
                  onClick={()=>setRole(r.value)}
                  className={`rounded-lg border p-3 text-left text-xs transition-all ${
                    role === r.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <p className="font-semibold">{r.label}</p>
                  <p className="mt-0.5 opacity-70">{r.desc}</p>
                </button>
              ))}
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
}