import { useState } from "react";
import { useSale } from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function RoomsManager() {
  const { data: sale } = useSale();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("sale").insert({ name, color, display_order: (sale?.length || 0) });
    if (error) { toast.error(error.message); return; }
    setName(""); qc.invalidateQueries({ queryKey: ["sale"] }); toast.success("Room added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("sale").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["sale"] }); qc.invalidateQueries({ queryKey: ["stages"] }); toast.success("Room deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" className="flex-1 min-w-[200px] rounded-lg bg-secondary border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none" />
        <button onClick={add} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90">Add</button>
      </div>
      <div className="space-y-2">
        {sale?.map((r) => (
          <div key={r.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="font-medium text-foreground">{r.name}</span>
            </div>
            <button onClick={() => remove(r.id)} className="text-destructive text-sm hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
