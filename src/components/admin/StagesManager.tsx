import { useState } from "react";
import { useStages, useSale, useGiorni, useLivelli, useEventi } from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

const empty = { artist: "", title: "", start_time: "10:00", end_time: "11:00", sala_id: "", giorno_id: "", livello_id: "", notes: "" };

export default function StagesManager() {
  const { data: stages } = useStages();
  const { data: sale } = useSale();
  const { data: giorni } = useGiorni();
  const { data: livelli } = useLivelli();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.artist || !form.title || !form.sala_id || !form.giorno_id) {
      toast.error("Fill required fields"); return;
    }
    const payload = {
      artist: form.artist,
      title: form.title,
      start_time: form.start_time,
      end_time: form.end_time,
      sala_id: form.sala_id,
      giorno_id: form.giorno_id,
      livello_id: form.livello_id || null,
      notes: form.notes || null,
    };
    if (editingId) {
      const { error } = await supabase.from("stages").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Stage updated");
    } else {
      const { error } = await supabase.from("stages").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Stage added");
    }
    setForm(empty); setEditingId(null);
    qc.invalidateQueries({ queryKey: ["stages"] });
  };

  const edit = (s: StageWithRelations) => {
    setEditingId(s.id);
    setForm({ artist: s.artist, title: s.title, start_time: s.start_time, end_time: s.end_time, sala_id: s.sala_id, giorno_id: s.giorno_id, livello_id: s.livello_id || "", notes: s.notes || "" });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("stages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["stages"] }); toast.success("Stage deleted");
  };

  const cancel = () => { setForm(empty); setEditingId(null); };

  const selectClass = "rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const inputClass = selectClass;

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading font-semibold text-foreground">{editingId ? "Edit Stage" : "Add Stage"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.artist} onChange={(e) => set("artist", e.target.value)} placeholder="Artist *" className={inputClass} />
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Title *" className={inputClass} />
          <select value={form.sala_id} onChange={(e) => set("sala_id", e.target.value)} className={selectClass}>
            <option value="">Select Room *</option>
            {sale?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={form.giorno_id} onChange={(e) => set("giorno_id", e.target.value)} className={selectClass}>
            <option value="">Select Day *</option>
            {giorni?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={form.livello_id} onChange={(e) => set("livello_id", e.target.value)} className={selectClass}>
            <option value="">Select Level</option>
            {livelli?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputClass} />
          <input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} className={inputClass} />
          <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes" className={inputClass} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-90">
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && <button onClick={cancel} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-80">Cancel</button>}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {(stages as StageWithRelations[] | undefined)?.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">{s.artist} — {s.title}</div>
              <div className="text-sm text-muted-foreground">
                {s.sale?.name} · {s.giorni?.name} · {s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)}
                {s.livelli && <span className="ml-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.livelli.color, color: "#000" }}>{s.livelli.name}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => edit(s)} className="text-primary text-sm hover:underline">Edit</button>
              <button onClick={() => remove(s.id)} className="text-destructive text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
