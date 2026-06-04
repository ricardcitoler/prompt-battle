import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminLogin } from "@/lib/admin.functions";
import { getAdminAuth, setAdminAuth } from "@/lib/local-user";

export const Route = createFileRoute("/admin/")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminAuth()) navigate({ to: "/admin/panel" });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await adminLogin({ data: { email, password } });
      setAdminAuth({ token: r.token, userId: r.userId });
      navigate({ to: "/admin/panel" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Volver al registro
        </Link>
        <form onSubmit={submit} className="space-y-4">
          <h1 className="text-2xl font-bold text-center">Admin</h1>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-md bg-input border border-border px-4 py-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            autoComplete="current-password"
            className="w-full rounded-md bg-input border border-border px-4 py-3"
          />
          {err && <p className="text-destructive text-sm">{err}</p>}
          <button
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground font-bold py-3 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
