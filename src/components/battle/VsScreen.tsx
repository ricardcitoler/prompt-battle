import { ParticipantCard, type Participant } from "./ParticipantCard";

interface VsScreenProps {
  p1: Participant;
  p2: Participant;
  title: string;
  onStart: () => void;
}

export function VsScreen({ p1, p2, title, onStart }: VsScreenProps) {
  return (
    <div className="pt-8">
      <h1 className="text-center text-[35px] md:text-[60px] max-w-3xl mx-auto font-extrabold px-4">
        {title}
      </h1>
      <div className="mt-10 grid grid-cols-2 gap-8 items-center justify-items-center">
        <ParticipantCard participant={p1} />
        <ParticipantCard participant={p2} />
      </div>
      <div className="mt-10 text-center">
        <button
          onClick={onStart}
          className="rounded-md bg-white text-primary-foreground font-bold px-8 py-3 text-lg hover:opacity-90"
        >
          Votar
        </button>
      </div>
    </div>
  );
}
