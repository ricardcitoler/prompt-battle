import type { Participant } from "./ParticipantCard";

interface VoteCardProps {
  participant: Participant;
  score: number;
  onScoreChange: (score: number) => void;
}

export function VoteCard({ participant, score, onScoreChange }: VoteCardProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-muted">
        {participant.image_url ? (
          <img
            src={participant.image_url}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary-foreground bg-primary">
            {participant.name[0]}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-end gap-4 text-center bg-black/40 rounded-[10px] px-[10px] pb-8 pt-[120px] md:pt-[140px] mt-[-100px] md:mt-[-126px] w-full max-w-[340px]">
        <h3 className="font-bold text-xl text-foreground">{participant.name}</h3>
        <div className="w-full mt-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Puntua del 1 al 10
          </label>
          <div className="mt-3 flex items-center justify-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={score}
              onChange={(e) => onScoreChange(Number(e.target.value))}
              className="flex-1 accent-[oklch(0.88_0.25_130)]"
            />
            <span className="w-12 text-3xl font-extrabold text-primary text-center">{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
