import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  listBattles,
  upsertBattle,
  activateBattle,
  deactivateAll,
  deleteBattle,
} from "@/lib/admin.functions";
import { uploadImage } from "@/lib/upload.functions";
import { getAdminAuth, clearAdminAuth, type AdminAuth } from "@/lib/local-user";
import { BattleCard } from "@/components/admin/BattleCard";
import { EditModal, type BattleForm, type ParticipantForm } from "@/components/admin/EditModal";
import type { Database } from "@/integrations/supabase/types";

type Battle = Database["public"]["Tables"]["battles"]["Row"];
type Participant = Database["public"]["Tables"]["participants"]["Row"];

export const Route = createFileRoute("/admin/panel")({
  component: Panel,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function resolveParticipantImage(
  auth: AdminAuth,
  participant: ParticipantForm,
): Promise<string | null> {
  if (!(participant.image_url instanceof File)) {
    return participant.image_url || null;
  }

  const base64 = await fileToBase64(participant.image_url);
  const { publicUrl } = await uploadImage({
    data: {
      bearerToken: auth.token,
      userId: auth.userId,
      fileName: participant.image_url.name,
      contentType: participant.image_url.type || "image/jpeg",
      data: base64,
    },
  });

  return publicUrl;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Panel() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AdminAuth | null>(null);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editing, setEditing] = useState<BattleForm | null>(null);

  const load = useCallback(async (token: string) => {
    const r = await listBattles({ data: { token } });
    setBattles(r.battles);
    setParticipants(r.participants);
  }, []);

  useEffect(() => {
    const storedAuth = getAdminAuth();
    if (!storedAuth) {
      navigate({ to: "/admin" });
      return;
    }
    setAuth(storedAuth);
    load(storedAuth.token);
  }, [navigate, load]);

  if (!auth) return null;

  const participantsByBattle = (id: string) =>
    participants.filter((p) => p.battle_id === id).sort((a, b) => a.position - b.position);

  function startNew() {
    setEditing({
      id: undefined,
      slug: "",
      title: "",
      num_rounds: 2,
      participants: [
        { name: "", description: "", image_url: "", position: 1 },
        { name: "", description: "", image_url: "", position: 2 },
      ],
    });
  }

  function startEdit(b: Battle) {
    const ps = participantsByBattle(b.id);
    setEditing({
      id: b.id,
      slug: b.slug,
      title: b.title,
      num_rounds: b.num_rounds,
      participants: [1, 2].map((pos) => {
        const found = ps.find((x) => x.position === pos);
        return found
          ? {
              id: found.id,
              name: found.name,
              description: found.description ?? "",
              image_url: found.image_url ?? "",
              position: pos,
            }
          : { name: "", description: "", image_url: "", position: pos };
      }) as BattleForm["participants"],
    });
  }

  return (
    <div>
      <header className="p-6 flex justify-between items-center border-b border-border">
        <div className="text-primary font-bold tracking-tight">LEARNING HEROES — Admin</div>
        <button
          onClick={() => {
            clearAdminAuth();
            navigate({ to: "/admin" });
          }}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Salir
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold">Batallas</h1>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await deactivateAll({ data: { token: auth.token } });
                await load(auth.token);
              }}
              className="flex-1 lg:flex-none rounded-md border border-border px-4 py-2 text-sm"
            >
              Desactivar todas
            </button>
            <button
              onClick={startNew}
              className="flex-1 lg:flex-none rounded-md bg-primary text-primary-foreground font-bold px-4 py-2 text-sm"
            >
              + Nueva batalla
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {battles.map((b) => (
            <BattleCard
              key={b.id}
              battle={b}
              participants={participantsByBattle(b.id)}
              onActivate={async () => {
                await activateBattle({
                  data: { token: auth.token, id: b.id, active: !b.is_active },
                });
                await load(auth.token);
              }}
              onEdit={() => startEdit(b)}
              onDelete={async () => {
                if (confirm("¿Borrar batalla?")) {
                  await deleteBattle({ data: { token: auth.token, id: b.id } });
                  await load(auth.token);
                }
              }}
            />
          ))}
          {battles.length === 0 && (
            <p className="text-muted-foreground">No hay batallas. Crea la primera.</p>
          )}
        </div>

        {editing && (
          <EditModal
            value={editing}
            onClose={() => setEditing(null)}
            onSave={async (v) => {
              const slug =
                v.slug || slugify(`${v.participants[0].name}-vs-${v.participants[1].name}`);

              const resolvedParticipants = await Promise.all(
                v.participants.map(async (p) => ({
                  ...p,
                  image_url: await resolveParticipantImage(auth, p),
                })),
              );

              await upsertBattle({
                data: {
                  token: auth.token,
                  id: v.id,
                  slug,
                  title: v.title,
                  num_rounds: v.num_rounds,
                  participants: resolvedParticipants,
                },
              });
              setEditing(null);
              await load(auth.token);
            }}
          />
        )}
      </main>
    </div>
  );
}
