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

const roles = [
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
      result.error.issues.forEach(i => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      // 🔥 CALL DJANGO BACKEND
      const response = await fetch(`${API}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      console.log("API RESPONSE:", data);

      // keep your frontend state login
      login(email, password, role);

      navigate("/dashboard");

    } catch (err) {
      console.error("Login API error:", err);
    }
  };