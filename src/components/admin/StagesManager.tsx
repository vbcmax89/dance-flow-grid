import { useState, useRef } from "react";
import { useStages, useSale, useGiorni, useLivelli } from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { Upload, X, Image, Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

const empty = { artist: "", title: "", start_time: "10:00", end_time: "11:00", sala_id: "", giorno_id: "", livello_id: "", notes: "", description: "" };

export default function StagesManager({ eventoId }: { eventoId: string }) {
  const { data: stages } = useStages(eventoId);
  const { data: sale } = useSale(eventoId);
  const { data: giorni } = useGiorni(eventoId);
  const { data: livelli } = useLivelli(eventoId);
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setForm(empty);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (s: StageWithRelations) => {
    setEditingId(s.id);
    setForm({
      artist: s.artist, title: s.title, start_time: s.start_time, end_time: s.end_time,
      sala_id: s.sala_id, giorno_id: s.giorno_id, livello_id: s.livello_id || "",
      notes: s.notes || "", description: s.description || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(empty);
    setEditingId(null);
  };

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
      evento_id: eventoId,
      notes: form.notes || null,
      description: form.description || null,
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
    closeModal();
    qc.invalidateQueries({ queryKey: ["stages", eventoId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("stages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["stages", eventoId] });
    toast.success("Stage deleted");
  };

  const handleUploadClick = (stageId: string) => {
    setUploadTargetId(stageId);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setUploading(uploadTargetId);
    const ext = file.name.split(".").pop();
    const path = `artists/${uploadTargetId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("event-assets").getPublicUrl(path);
    const { error: updateError } = await supabase.from("stages").update({ artist_image_url: urlData.publicUrl }).eq("id", uploadTargetId);
    if (updateError) { toast.error(updateError.message); setUploading(null); return; }
    toast.success("Artist image uploaded!");
    qc.invalidateQueries({ queryKey: ["stages", eventoId] });
    setUploading(null);
    setUploadTargetId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = async (stageId: string) => {
    const { error } = await supabase.from("stages").update({ artist_image_url: null }).eq("id", stageId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["stages", eventoId] });
    toast.success("Image removed");
  };

  const selectClass = "rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const inputClass = selectClass;

  return (
    <div className="space-y-4">
      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Add Stage button */}
      <button
        onClick={openAdd}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90"
      >
        <Plus size={16} /> Add Stage
      </button>

      {/* Stage list */}
      <div className="space-y-2">
        {(stages as StageWithRelations[] | undefined)?.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {s.artist_image_url ? (
                  <img src={s.artist_image_url} alt={s.artist} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Image size={16} className="text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{s.artist} — {s.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {s.sale?.name} · {s.giorni?.name} · {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                    {s.livelli && (
                      <span className="ml-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.livelli.color, color: "#000" }}>
                        {s.livelli.name}
                      </span>
                    )}
                  </div>
                  {s.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</div>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                <button onClick={() => handleUploadClick(s.id)} disabled={uploading === s.id} className="text-primary text-sm hover:underline flex items-center gap-1">
                  <Upload size={12} /> {s.artist_image_url ? "Replace" : "Photo"}
                </button>
                {s.artist_image_url && (
                  <button onClick={() => removeImage(s.id)} className="text-destructive text-sm hover:underline flex items-center gap-1">
                    <X size={12} />
                  </button>
                )}
                <button onClick={() => openEdit(s)} className="text-primary text-sm hover:underline flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => remove(s.id)} className="text-destructive text-sm hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Stage" : "Add Stage"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
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
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                  <input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputClass + " w-full"} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} className={inputClass + " w-full"} />
                </div>
              </div>
              <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes" className={inputClass + " sm:col-span-2"} />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Description (what is this stage about, details for attendees...)"
              rows={3}
              className={inputClass + " w-full resize-y"}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-90">
                {editingId ? "Update" : "Add"}
              </button>
              <button onClick={closeModal} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-80">
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
