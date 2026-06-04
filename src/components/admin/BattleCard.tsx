import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

type Battle = Database["public"]["Tables"]["battles"]["Row"];
type Participant = Database["public"]["Tables"]["participants"]["Row"];

interface BattleCardProps {
  battle: Battle;
  participants: Participant[];
  onActivate: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function BattleCard({
  battle,
  participants,
  onActivate,
  onEdit,
  onDelete,
}: BattleCardProps) {
  return (
    <div className="rounded-lg border border-border p-4 bg-secondary/30 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-lg">{battle.title}</h3>
          {battle.is_active && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
              ACTIVA
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          /{battle.slug} · {battle.num_rounds} rondas
        </div>
        <div className="text-sm mt-2">{participants.map((p) => p.name).join(" vs ")}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:justify-end">
        <button
          onClick={onActivate}
          className={`rounded-md font-bold text-sm px-3 py-2 lg:py-1.5 ${battle.is_active ? "border border-border" : "bg-primary text-primary-foreground"}`}
        >
          {battle.is_active ? "Desactivar" : "Activar"}
        </button>
        <Link
          to="/dashboard/$slug"
          params={{ slug: battle.slug }}
          className="rounded-md border border-border text-sm px-3 py-2 lg:py-1.5 text-center"
        >
          Dashboard
        </Link>
        <button
          onClick={onEdit}
          className="rounded-md border border-border text-sm px-3 py-2 lg:py-1.5"
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          className="rounded-md border border-destructive text-destructive text-sm px-3 py-2 lg:py-1.5"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
