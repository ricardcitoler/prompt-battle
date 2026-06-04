import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Field } from "./Field";
import { ImageUpload } from "./ImageUpload";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function autoSlug(p0: string, p1: string) {
  const a = slugify(p0);
  const b = slugify(p1);
  return a && b ? `${a}-vs-${b}` : a || b;
}

export interface ParticipantForm {
  id?: string;
  name: string;
  description: string;
  image_url: File | string;
  position: number;
}

export interface BattleForm {
  id?: string;
  slug: string;
  title: string;
  num_rounds: number;
  participants: [ParticipantForm, ParticipantForm];
}

interface EditModalProps {
  value: BattleForm;
  onClose: () => void;
  onSave: (v: BattleForm) => Promise<void>;
}

const BATTLE_BASE_URL = "https://battles.learningheroes.com/";

export function EditModal({ value, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState<BattleForm>(value);
  const [slugTouched, setSlugTouched] = useState(!!value.id);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function copyUrl() {
    navigator.clipboard.writeText(`${BATTLE_BASE_URL}${form.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function setPart(i: number, patch: Partial<ParticipantForm>) {
    const updatedParticipants = form.participants.map((p, idx) =>
      idx === i ? { ...p, ...patch } : p,
    ) as [ParticipantForm, ParticipantForm];

    const nextSlug =
      !slugTouched && "name" in patch
        ? autoSlug(updatedParticipants[0].name, updatedParticipants[1].name)
        : form.slug;

    setForm({ ...form, participants: updatedParticipants, slug: nextSlug });
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      if (!form.title.trim()) throw new Error("Falta el título");
      if (!form.participants[0].name.trim() || !form.participants[1].name.trim())
        throw new Error("Ambos participantes necesitan un nombre");
      await onSave(form);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center py-10 px-4">
        <div className="bg-background border border-border rounded-xl p-6 max-w-2xl w-full">
          <h2 className="text-xl font-bold mb-4">{form.id ? "Editar" : "Nueva"} batalla</h2>
          <div className="grid gap-3">
            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md bg-input border border-border px-3 py-2"
              />
            </Field>
            <Field label="URL">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-md bg-input border border-border px-3 py-2 min-w-0 text-sm">
                  <span className="text-muted-foreground shrink-0">{BATTLE_BASE_URL}</span>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm({ ...form, slug: e.target.value.toLowerCase() });
                    }}
                    placeholder="auto"
                    className="bg-transparent outline-none min-w-0 w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={copyUrl}
                  disabled={!form.slug}
                  title={`${BATTLE_BASE_URL}${form.slug}`}
                  className="shrink-0 rounded-md border border-border px-3 py-2 text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Rondas">
              <input
                type="number"
                min={1}
                max={20}
                value={form.num_rounds}
                onChange={(e) => setForm({ ...form, num_rounds: Number(e.target.value) })}
                className="w-full rounded-md bg-input border border-border px-3 py-2"
              />
            </Field>
            {([0, 1] as const).map((i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="text-sm text-muted-foreground mb-2">Participante {i + 1}</div>
                <div className="grid gap-2">
                  <input
                    placeholder="Nombre"
                    value={form.participants[i].name}
                    onChange={(e) => setPart(i, { name: e.target.value })}
                    className="rounded-md bg-input border border-border px-3 py-2"
                  />
                  <ImageUpload
                    value={form.participants[i].image_url}
                    onChange={(v) => setPart(i, { image_url: v })}
                    disabled={saving}
                  />
                  <textarea
                    placeholder="Descripción"
                    value={form.participants[i].description}
                    onChange={(e) => setPart(i, { description: e.target.value })}
                    rows={2}
                    className="rounded-md bg-input border border-border px-3 py-2"
                  />
                </div>
              </div>
            ))}
            {err && <p className="text-destructive text-sm">{err}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={onClose} className="rounded-md border border-border px-4 py-2">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-md bg-primary text-primary-foreground font-bold px-4 py-2 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
