import { VoteCard } from "./VoteCard";
import type { Participant } from "./ParticipantCard";

interface RoundScreenProps {
  round: number;
  totalRounds: number;
  p1: Participant;
  p2: Participant;
  scoreP1: number;
  scoreP2: number;
  onScoreP1Change: (score: number) => void;
  onScoreP2Change: (score: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function RoundScreen({
  round,
  totalRounds,
  p1,
  p2,
  scoreP1,
  scoreP2,
  onScoreP1Change,
  onScoreP2Change,
  onSubmit,
  submitting,
}: RoundScreenProps) {
  return (
    <div className="pt-6">
      <div className="text-center text-primary font-bold tracking-wide">
        RONDA {round} / {totalRounds}
      </div>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
        <VoteCard participant={p1} score={scoreP1} onScoreChange={onScoreP1Change} />
        <VoteCard participant={p2} score={scoreP2} onScoreChange={onScoreP2Change} />
      </div>
      <div className="mt-8 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-md bg-white text-primary-foreground font-bold px-8 py-3 text-lg disabled:opacity-50 hover:opacity-90"
        >
          {submitting ? "Enviando…" : "Enviar votos"}
        </button>
      </div>
    </div>
  );
}
