import type { Database } from "@/integrations/supabase/types";

export type Participant = Database["public"]["Tables"]["participants"]["Row"];

interface ParticipantCardProps {
  participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="rounded-full overflow-hidden bg-muted shrink-0"
        style={{ width: 150, height: 150 }}
      >
        {participant.image_url ? (
          <img
            src={participant.image_url}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-foreground bg-primary">
            {participant.name[0]}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 items-center text-center bg-black/40 rounded-[10px] px-[10px] py-4 justify-end mt-4 min-w-[150px]">
        <h2 className="font-bold text-[18px] md:text-xl text-foreground">{participant.name}</h2>
        {participant.description && (
          <p className="text-muted-foreground">{participant.description}</p>
        )}
      </div>
    </div>
  );
}
