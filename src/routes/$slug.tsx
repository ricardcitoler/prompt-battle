import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBattleBySlug, getUserVotes, submitRoundVotes } from "@/lib/battle.functions";
import { getLocalUser, type LocalUser } from "@/lib/local-user";
import { Navbar } from "@/components/Navbar";
import { VsScreen } from "@/components/battle/VsScreen";
import { RoundScreen } from "@/components/battle/RoundScreen";
import { BetweenScreen } from "@/components/battle/BetweenScreen";
import { DoneScreen } from "@/components/battle/DoneScreen";
import type { Participant } from "@/components/battle/ParticipantCard";

export const Route = createFileRoute("/$slug")({
  component: BattlePage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center text-destructive p-6">
      {error.message}
    </div>
  ),
});

type Loaded = Awaited<ReturnType<typeof getBattleBySlug>>;
type Stage = "vs" | "round" | "between" | "done";
type LoadStatus = "loading" | "not-found" | "not-active" | "ready";

function BattlePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [stage, setStage] = useState<Stage>("vs");
  const [round, setRound] = useState(1);
  const [scoreP1, setScoreP1] = useState(5);
  const [scoreP2, setScoreP2] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const u = getLocalUser();
    if (!u) {
      navigate({ to: "/" });
      return;
    }
    setUser(u);
    (async () => {
      const d = await getBattleBySlug({ data: { slug } });
      if (!d) {
        setStatus("not-found");
        return;
      }
      if (!d.battle.is_active) {
        setStatus("not-active");
        return;
      }
      setStatus("ready");
      setData(d);
      const votes = await getUserVotes({ data: { userId: u.id, battleId: d.battle.id } });
      const byRound: Record<number, Set<string>> = {};
      for (const row of votes) {
        byRound[row.round_number] = byRound[row.round_number] ?? new Set();
        byRound[row.round_number].add(row.participant_id);
      }
      const completedRounds = new Set(
        Array.from({ length: d.battle.num_rounds }, (_, i) => i + 1).filter(
          (r) => byRound[r] && byRound[r].size >= d.participants.length,
        ),
      );
      let next = 1;
      while (next <= d.battle.num_rounds && completedRounds.has(next)) next++;
      if (next > d.battle.num_rounds) setStage("done");
      else setRound(next);
    })();
  }, [slug, navigate]);

  if (status === "loading") return <div className="min-h-screen" />;

  if (status === "not-found")
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">🚫</p>
        <h1 className="text-2xl font-bold">Battle not found</h1>
        <p className="text-muted-foreground">
          There is no battle at <span className="font-mono text-foreground">/{slug}</span>.
        </p>
      </div>
    );

  if (status === "not-active")
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">⏳</p>
        <h1 className="text-2xl font-bold">Battle not active yet</h1>
        <p className="text-muted-foreground">
          This battle exists but hasn't started yet. Come back soon!
        </p>
      </div>
    );

  if (!data) return null;

  const [p1, p2] = data.participants as [Participant | undefined, Participant | undefined];
  if (!p1 || !p2)
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        Batalla incompleta
      </div>
    );

  async function submit() {
    if (!user || !data || !p1 || !p2) return;
    setSubmitting(true);
    try {
      await submitRoundVotes({
        data: {
          userId: user.id,
          battleId: data.battle.id,
          roundNumber: round,
          scores: [
            { participantId: p1.id, score: scoreP1 },
            { participantId: p2.id, score: scoreP2 },
          ],
        },
      });
      if (round >= data.battle.num_rounds) {
        setStage("done");
      } else {
        setRound(round + 1);
        setStage("between");
        setScoreP1(5);
        setScoreP2(5);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col px-4 pb-16 max-w-4xl mx-auto w-full">
        {stage === "vs" && (
          <div className="flex flex-1 items-center justify-center">
            <VsScreen p1={p1} p2={p2} title={data.battle.title} onStart={() => setStage("round")} />
          </div>
        )}
        {stage === "round" && (
          <RoundScreen
            round={round}
            totalRounds={data.battle.num_rounds}
            p1={p1}
            p2={p2}
            scoreP1={scoreP1}
            scoreP2={scoreP2}
            onScoreP1Change={setScoreP1}
            onScoreP2Change={setScoreP2}
            onSubmit={submit}
            submitting={submitting}
          />
        )}
        {stage === "between" && <BetweenScreen round={round} onNext={() => setStage("round")} />}
        {stage === "done" && (
          <div className="flex flex-1 items-center justify-center">
            <DoneScreen title={data.battle.title} p1={p1} p2={p2} />
          </div>
        )}
      </main>
    </div>
  );
}
