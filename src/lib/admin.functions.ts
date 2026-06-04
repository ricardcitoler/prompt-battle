import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9-]+$/);

function assertAdmin(token: string) {
  // Validate that the token is a well-formed JWT (header.payload.signature)
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((p) => !p)) throw new Error("Unauthorized");
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const apiUrl = process.env.INTERNAL_API_URL;
    if (!apiUrl) throw new Error("INTERNAL_API_URL not configured");

    const loginRes = await fetch(`${apiUrl}/users/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
    if (!loginRes.ok) throw new Error("Credenciales incorrectas");
    const { access_token } = (await loginRes.json()) as { access_token: string };

    const profilesRes = await fetch(`${apiUrl}/users/auth/profiles`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profilesRes.ok) throw new Error("No se pudieron obtener los perfiles");
    const profilesData = (await profilesRes.json()) as {
      data: Array<{ id: string; userType: string }>;
    };

    const adminUser = profilesData.data?.find((u) => u.userType === "admin");
    if (!adminUser) throw new Error("Esta cuenta no tiene acceso de administrador");

    return {
      token: access_token,
      userId: adminUser.id,
    };
  });

export const listBattles = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: battles } = await supabaseAdmin
      .from("battles")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: participants } = await supabaseAdmin
      .from("participants")
      .select("*")
      .order("position");
    return { battles: battles ?? [], participants: participants ?? [] };
  });

export const upsertBattle = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: z.string(),
        id: z.string().uuid().optional(),
        slug: slugSchema,
        title: z.string().min(1).max(200),
        num_rounds: z.number().int().min(1).max(20),
        participants: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              name: z.string().min(1).max(120),
              description: z.string().max(500).nullable().optional(),
              image_url: z.string().max(2000).nullable().optional(),
              position: z.number().int().min(1).max(2),
            }),
          )
          .length(2),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let battleId = data.id;
    if (battleId) {
      const { error } = await supabaseAdmin
        .from("battles")
        .update({ slug: data.slug, title: data.title, num_rounds: data.num_rounds })
        .eq("id", battleId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("battles")
        .insert({ slug: data.slug, title: data.title, num_rounds: data.num_rounds })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      battleId = row.id;
    }
    for (const p of data.participants) {
      if (p.id) {
        await supabaseAdmin
          .from("participants")
          .update({
            name: p.name,
            description: p.description ?? null,
            image_url: p.image_url ?? null,
            position: p.position,
          })
          .eq("id", p.id);
      } else {
        await supabaseAdmin.from("participants").insert({
          battle_id: battleId,
          name: p.name,
          description: p.description ?? null,
          image_url: p.image_url ?? null,
          position: p.position,
        });
      }
    }
    return { id: battleId };
  });

export const activateBattle = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: z.string(), id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("battles")
      .update({ is_active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deactivateAll = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("battles").update({ is_active: false }).eq("is_active", true);
    return { ok: true };
  });

export const deleteBattle = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("battles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
