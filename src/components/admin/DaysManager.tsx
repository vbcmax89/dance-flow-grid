import { useState } from "react";
import { useGiorni } from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DaysManager({ eventoId }: { eventoId: string }) {
  const { data: giorni } = useGiorni(eventoId);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("giorni").insert({ name, date: date || null, display_order: (giorni?.length || 0), evento_id: eventoId });
    if (error) { toast.error(error.message); return; }
    setName(""); setDate(""); qc.invalidateQueries({ queryKey: ["giorni", eventoId] }); toast.success("Day added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("giorni").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["giorni", eventoId] }); qc.invalidateQueries({ queryKey: ["stages", eventoId] }); toast.success("Day deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Day name (e.g. Friday)" className="flex-1 min-w-[150px] rounded-lg bg-secondary border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={add} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90">Add</button>
      </div>
      <div className="space-y-2">
        {giorni?.map((g) => (
          <div key={g.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
            <span className="font-medium text-foreground">{g.name} {g.date && <span className="text-muted-foreground text-sm ml-2">{g.date}</span>}</span>
            <button onClick={() => remove(g.id)} className="text-destructive text-sm hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
