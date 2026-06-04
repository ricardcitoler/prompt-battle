import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/battle.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/$slug")({
  component: Dashboard,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
});

type Data = Awaited<ReturnType<typeof getDashboard>>;

function Dashboard() {
  const { slug } = Route.useParams();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const d = await getDashboard({ data: { slug } });
      if (active) setData(d);
    };
    load();
    const ch = supabase
      .channel(`dash-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [slug]);

  if (!data) return <div className="min-h-screen bg-[#0F0F10]" />;
  if (!data.battle) return <div className="p-6 text-white">Batalla no encontrada</div>;

  const [p1, p2] = data.participants;
  const userNameById = new Map(data.users.map((u: any) => [u.id, u.name]));
  const participantNameById = new Map(data.participants.map((p: any) => [p.id, p.name]));

  const roundsArr = Array.from({ length: data.battle.num_rounds }, (_, i) => i + 1);
  function avgFor(roundNo: number, participantId: string) {
    const v = data!.votes.filter(
      (x: any) => x.round_number === roundNo && x.participant_id === participantId,
    );
    if (!v.length) return null;
    return v.reduce((s: number, x: any) => s + x.score, 0) / v.length;
  }
  function overallAvg(participantId: string) {
    const v = data!.votes.filter((x: any) => x.participant_id === participantId);
    if (!v.length) return null;
    return v.reduce((s: number, x: any) => s + x.score, 0) / v.length;
  }
  const o1 = overallAvg(p1?.id) ?? 0;
  const o2 = overallAvg(p2?.id) ?? 0;
  const winner = o1 === o2 ? null : o1 > o2 ? p1 : p2;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0F0F10" }}>
      <header className="px-6 py-5 flex items-center justify-between border-b border-white/10">
        <div className="font-bold tracking-tight" style={{ color: "#22d3ee" }}>
          LEARNING HEROES
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/panel"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Configuración de batallas
          </Link>
          <div className="text-sm text-white/60">Resultados en directo</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h1 className="text-3xl font-extrabold">{data.battle.title}</h1>
          <div className="mt-6 grid grid-cols-2 gap-6">
            <ScoreCard p={p1} score={o1} highlight={winner?.id === p1?.id} />
            <ScoreCard p={p2} score={o2} highlight={winner?.id === p2?.id} />
          </div>
          {winner && (
            <div className="mt-4 text-center text-lg">
              Ganador general:{" "}
              <span style={{ color: "#E9B949" }} className="font-extrabold">
                {winner.name}
              </span>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Por ronda</h2>
          <div className="grid gap-3">
            {roundsArr.map((r) => {
              const a = avgFor(r, p1?.id);
              const b = avgFor(r, p2?.id);
              const w = a == null || b == null ? null : a === b ? null : a > b ? p1 : p2;
              return (
                <div
                  key={r}
                  className="grid grid-cols-[80px_1fr_1fr_1fr] gap-3 items-center bg-white/5 rounded-lg p-4"
                >
                  <div className="font-bold text-white/70">Ronda {r}</div>
                  <div>
                    {p1?.name}: <b className="text-white">{a?.toFixed(2) ?? "—"}</b>
                  </div>
                  <div>
                    {p2?.name}: <b className="text-white">{b?.toFixed(2) ?? "—"}</b>
                  </div>
                  <div className="text-right">
                    {w ? (
                      <span style={{ color: "#E9B949" }} className="font-bold">
                        🏆 {w.name}
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Votos individuales</h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="text-left p-3">Usuario</th>
                  <th className="text-left p-3">Ronda</th>
                  <th className="text-left p-3">Puntuación</th>
                  <th className="text-left p-3">Concursante</th>
                </tr>
              </thead>
              <tbody>
                {[...data.votes]
                  .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
                  .map((v: any) => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="p-3">{userNameById.get(v.user_id) ?? "—"}</td>
                      <td className="p-3">{v.round_number}</td>
                      <td className="p-3 font-bold" style={{ color: "#E9B949" }}>
                        {v.score}
                      </td>
                      <td className="p-3">{participantNameById.get(v.participant_id) ?? "—"}</td>
                    </tr>
                  ))}
                {data.votes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-white/50">
                      Sin votos todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function ScoreCard({ p, score, highlight }: any) {
  if (!p) return null;
  return (
    <div
      className="rounded-xl p-6 border"
      style={{
        borderColor: highlight ? "#E9B949" : "rgba(255,255,255,.1)",
        backgroundColor: highlight ? "rgba(233,185,73,.08)" : "rgba(255,255,255,.04)",
      }}
    >
      {p.image_url ? (
        <img src={p.image_url} alt={p.name} className="w-24 h-24 rounded-lg object-cover" />
      ) : (
        <div className="w-24 h-24 rounded-lg bg-white/10 flex items-center justify-center text-3xl font-bold">
          {p.name[0]}
        </div>
      )}
      <h3 className="mt-3 text-xl font-bold">{p.name}</h3>
      <div
        className="mt-2 text-4xl font-extrabold"
        style={{ color: highlight ? "#E9B949" : "white" }}
      >
        {score.toFixed(2)}
      </div>
      <div className="text-xs text-white/50">promedio general</div>
    </div>
  );
}
