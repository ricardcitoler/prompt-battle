import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getActiveBattle } from "@/lib/battle.functions";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/waiting")({
  component: Waiting,
});

function Waiting() {
  const navigate = useNavigate();

  useEffect(() => {
    getActiveBattle().then((active) => {
      if (active?.battle) {
        navigate({ to: "/$slug", params: { slug: active.battle.slug } });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold">No hay batalla activa</h1>
          <p className="mt-2 text-muted-foreground">Vuelve cuando arranque la siguiente ronda.</p>
        </div>
      </div>
    </div>
  );
}
