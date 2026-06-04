import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { registerUser, getActiveBattle } from "@/lib/battle.functions";
import { getLocalUser, setLocalUser } from "@/lib/local-user";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Disruptive Show — Batalla de Prompts" },
      { name: "description", content: "Regístrate para votar en directo." },
      { property: "og:title", content: "The Disruptive Show — Batalla de Prompts" },
      { property: "og:description", content: "Regístrate para votar en directo." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = getLocalUser();
    if (u) routeToActive(navigate);
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await registerUser({ data: { name, email } });
      setLocalUser(user);
      await routeToActive(navigate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <Navbar showAdminLink />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl md:text-[60px] font-extrabold tracking-tight text-center">
            Decide el ganador de la batalla de {""}
            <span className="text-primary">Prompts {""}</span>
            más épica de todas
          </h1>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <input
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-md bg-transparent border border-white px-4 py-3 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              required
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-md bg-transparent border border-white px-4 py-3 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary text-primary-foreground font-bold py-3 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar a votar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

async function routeToActive(navigate: ReturnType<typeof useNavigate>) {
  const active = await getActiveBattle();
  if (active?.battle) {
    navigate({ to: "/$slug", params: { slug: active.battle.slug } });
  } else {
    navigate({ to: "/waiting" });
  }
}
