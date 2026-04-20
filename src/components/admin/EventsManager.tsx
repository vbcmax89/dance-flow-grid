import { useState, useRef } from "react";
import { useEventi } from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X, Image, Plus, Pencil, Globe, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { decodeEventMeta, encodeEventMeta } from "@/lib/eventMeta";

const emptyForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
  styles: "",
  website_url: "",
  pass_url: "",
};

export default function EventsManager() {
  const { data: eventi } = useEventi();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };

  const openEdit = (e: any) => {
    const meta = decodeEventMeta(e.description);
    setEditingId(e.id);
    setForm({
      name: e.name,
      description: meta.description || "",
      start_date: e.start_date || "",
      end_date: e.end_date || "",
      location: meta.location || "",
      styles: meta.styles || "",
      website_url: meta.website_url || "",
      pass_url: meta.pass_url || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); setEditingId(null); };

  const save = async () => {
    if (!form.name) { toast.error("Nome obbligatorio"); return; }
    const payload = {
      name: form.name,
      description: encodeEventMeta({
        description: form.description,
        location: form.location,
        styles: form.styles,
        website_url: form.website_url,
        pass_url: form.pass_url,
      }),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    if (editingId) {
      const { error } = await supabase.from("eventi").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Evento aggiornato");
    } else {
      const { error } = await supabase.from("eventi").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Evento aggiunto");
    }
    closeModal();
    qc.invalidateQueries({ queryKey: ["eventi"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("eventi").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["eventi"] });
    toast.success("Evento eliminato");
  };

  const handleUploadClick = (id: string) => { setUploadTargetId(id); fileRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setUploading(uploadTargetId);
    const ext = file.name.split(".").pop();
    const path = `covers/${uploadTargetId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("event-assets").getPublicUrl(path);
    const { error: updateError } = await supabase.from("eventi").update({ cover_image_url: urlData.publicUrl }).eq("id", uploadTargetId);
    if (updateError) { toast.error(updateError.message); setUploading(null); return; }
    toast.success("Cover caricata!");
    qc.invalidateQueries({ queryKey: ["eventi"] });
    setUploading(null); setUploadTargetId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeCover = async (id: string) => {
    const { error } = await supabase.from("eventi").update({ cover_image_url: null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["eventi"] });
    toast.success("Cover rimossa");
  };

  const inputClass = "rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full";

  return (
    <div className="space-y-4">
      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFileChange} />

      <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90">
        <Plus size={16} /> Aggiungi Evento
      </button>

      <div className="space-y-3">
        {eventi?.map((ev) => {
          const meta = decodeEventMeta(ev.description);
          return (
            <div key={ev.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex gap-3 flex-1 min-w-0">
                  {ev.cover_image_url ? (
                    <img src={ev.cover_image_url} alt="Cover" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Image size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-lg leading-tight">{ev.name}</div>
                    {meta.location && <div className="text-xs text-muted-foreground mt-0.5">📍 {meta.location}</div>}
                    {meta.styles && <div className="text-xs text-muted-foreground">💃 {meta.styles}</div>}
                    <div className="text-xs text-muted-foreground mt-1">
                      {ev.start_date && ev.end_date ? `${ev.start_date} → ${ev.end_date}` : ev.start_date || "Date non impostate"}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {meta.website_url && (
                        <a href={meta.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Globe size={11} /> Sito
                        </a>
                      )}
                      {meta.pass_url && (
                        <a href={meta.pass_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Ticket size={11} /> Pass
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <button onClick={() => handleUploadClick(ev.id)} disabled={uploading === ev.id}
                    className="text-primary text-sm hover:underline flex items-center gap-1">
                    <Upload size={12} /> {ev.cover_image_url ? "Cover" : "Upload"}
                  </button>
                  {ev.cover_image_url && (
                    <button onClick={() => removeCover(ev.id)} className="text-destructive text-sm hover:underline">
                      <X size={12} />
                    </button>
                  )}
                  <button onClick={() => openEdit(ev)} className="text-primary text-sm hover:underline flex items-center gap-1">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => remove(ev.id)} className="text-destructive text-sm hover:underline">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifica Evento" : "Aggiungi Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Nome evento *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Es. Apulia Bachata Congress" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Data inizio</label>
                <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Data fine</label>
                <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">📍 Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Es. Puglia, Italia" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">💃 Stili di ballo</label>
              <input value={form.styles} onChange={(e) => set("styles", e.target.value)} placeholder="Es. Bachata Fusion · Sensual · Urban" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium flex items-center gap-1.5">
                <Globe size={12} /> Sito web ufficiale
              </label>
              <input value={form.website_url} onChange={(e) => set("website_url", e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium flex items-center gap-1.5">
                <Ticket size={12} /> Link acquisto pass
              </label>
              <input value={form.pass_url} onChange={(e) => set("pass_url", e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Descrizione</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Descrizione dell'evento..." rows={3} className={inputClass + " resize-y"} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-90">
                {editingId ? "Aggiorna" : "Aggiungi"}
              </button>
              <button onClick={closeModal} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-80">
                Annulla
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
