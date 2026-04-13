import { useState, useRef } from "react";
import { useEventi } from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X, Image } from "lucide-react";

const empty = { name: "", description: "", start_date: "", end_date: "" };

export default function EventsManager() {
  const { data: eventi } = useEventi();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const payload = {
      name: form.name,
      description: form.description || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    if (editingId) {
      const { error } = await supabase.from("eventi").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Event updated");
    } else {
      const { error } = await supabase.from("eventi").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Event added");
    }
    setForm(empty); setEditingId(null);
    qc.invalidateQueries({ queryKey: ["eventi"] });
  };

  const edit = (e: any) => {
    setEditingId(e.id);
    setForm({ name: e.name, description: e.description || "", start_date: e.start_date || "", end_date: e.end_date || "" });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("eventi").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["eventi"] }); toast.success("Event deleted");
  };

  const cancel = () => { setForm(empty); setEditingId(null); };

  const handleUploadClick = (eventId: string) => {
    setUploadTargetId(eventId);
    fileRef.current?.click();
  };

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
    toast.success("Cover image uploaded!");
    qc.invalidateQueries({ queryKey: ["eventi"] });
    setUploading(null);
    setUploadTargetId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeCover = async (eventId: string) => {
    const { error } = await supabase.from("eventi").update({ cover_image_url: null }).eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["eventi"] });
    toast.success("Cover image removed");
  };

  const inputClass = "rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-6">
      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading font-semibold text-foreground">{editingId ? "Edit Event" : "Add Event"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Event Name *" className={inputClass} />
          <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" className={inputClass} />
          <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputClass} />
          <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputClass} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-90">
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && <button onClick={cancel} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-80">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {eventi?.map((ev) => (
          <div key={ev.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-lg">{ev.name}</div>
                {ev.description && <div className="text-sm text-muted-foreground">{ev.description}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {ev.start_date && ev.end_date ? `${ev.start_date} → ${ev.end_date}` : ev.start_date || "No dates set"}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => edit(ev)} className="text-primary text-sm hover:underline">Edit</button>
                <button onClick={() => remove(ev.id)} className="text-destructive text-sm hover:underline">Delete</button>
              </div>
            </div>

            {/* Cover image section */}
            <div className="border-t border-border pt-3">
              {ev.cover_image_url ? (
                <div className="space-y-2">
                  <img src={ev.cover_image_url} alt="Cover" className="w-full max-h-40 object-cover rounded-lg" />
                  <div className="flex gap-2">
                    <button onClick={() => handleUploadClick(ev.id)} className="text-primary text-xs hover:underline flex items-center gap-1">
                      <Upload size={12} /> Replace
                    </button>
                    <button onClick={() => removeCover(ev.id)} className="text-destructive text-xs hover:underline flex items-center gap-1">
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleUploadClick(ev.id)}
                  disabled={uploading === ev.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-lg px-4 py-3 w-full justify-center"
                >
                  {uploading === ev.id ? (
                    "Uploading..."
                  ) : (
                    <><Image size={16} /> Upload Cover Image</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
