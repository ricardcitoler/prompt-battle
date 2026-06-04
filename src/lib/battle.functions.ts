import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().email().max(255);
const nameSchema = z.string().min(1).max(120);
const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9-]+$/);

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: nameSchema, email: emailSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase().trim();
    const existing = await supabaseAdmin
      .from("users")
      .select("id,name,email")
      .eq("email", email)
      .maybeSingle();
    if (existing.data) return existing.data;
    const { data: row, error } = await supabaseAdmin
      .from("users")
      .insert({ name: data.name.trim(), email })
      .select("id,name,email")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getActiveBattle = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: battles } = await supabaseAdmin
    .from("battles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  const battle = battles?.[0];
  if (!battle) return null;
  const { data: participants } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("battle_id", battle.id)
    .order("position");
  return { battle, participants: participants ?? [] };
});

export const getBattleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: slugSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: battle } = await supabaseAdmin
      .from("battles")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!battle) return null;
    const { data: participants } = await supabaseAdmin
      .from("participants")
      .select("*")
      .eq("battle_id", battle.id)
      .order("position");
    return { battle, participants: participants ?? [] };
  });

export const getUserVotes = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), battleId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: votes } = await supabaseAdmin
      .from("votes")
      .select("round_number,participant_id,score")
      .eq("user_id", data.userId)
      .eq("battle_id", data.battleId);
    return votes ?? [];
  });

export const submitRoundVotes = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        battleId: z.string().uuid(),
        roundNumber: z.number().int().min(1).max(20),
        scores: z
          .array(
            z.object({
              participantId: z.string().uuid(),
              score: z.number().int().min(1).max(10),
            }),
          )
          .min(1)
          .max(2),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = data.scores.map((s) => ({
      battle_id: data.battleId,
      user_id: data.userId,
      participant_id: s.participantId,
      round_number: data.roundNumber,
      score: s.score,
    }));
    const { error } = await supabaseAdmin
      .from("votes")
      .upsert(rows, { onConflict: "user_id,battle_id,round_number,participant_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: slugSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: battle } = await supabaseAdmin
      .from("battles")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!battle) return null;
    const [{ data: participants }, { data: votes }, { data: users }] = await Promise.all([
      supabaseAdmin.from("participants").select("*").eq("battle_id", battle.id).order("position"),
      supabaseAdmin.from("votes").select("*").eq("battle_id", battle.id),
      supabaseAdmin.from("users").select("id,name"),
    ]);
    return {
      battle,
      participants: participants ?? [],
      votes: votes ?? [],
      users: users ?? [],
    };
  });
