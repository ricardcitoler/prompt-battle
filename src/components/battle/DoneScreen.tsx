import { ParticipantCard, type Participant } from "./ParticipantCard";

interface DoneScreenProps {
  title: string;
  p1: Participant;
  p2: Participant;
}

export function DoneScreen({ title, p1, p2 }: DoneScreenProps) {
  return (
    <div className="mt-12 text-center flex flex-col gap-10">
      <h1 className="text-2xl md:text-4xl font-extrabold">{title}</h1>
      <div className="grid grid-cols-2 gap-8 items-center justify-items-center">
        <ParticipantCard participant={p1} />
        <ParticipantCard participant={p2} />
      </div>
      <div>
        <h2 className="text-3xl font-bold">¡Gracias por votar!</h2>
        <p className="mt-2 text-muted-foreground">Tus puntuaciones han sido registradas.</p>
      </div>
    </div>
  );
}
