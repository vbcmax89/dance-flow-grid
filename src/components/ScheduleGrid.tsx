import { useState } from "react";
import { useSale, useStages } from "@/hooks/useScheduleData";
import { Tables } from "@/integrations/supabase/types";
import StageDetailModal from "./StageDetailModal";
import { Clock, User } from "lucide-react";
import { motion } from "framer-motion";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

function StageBlock({ stage, onClick, index }: { stage: StageWithRelations; onClick: () => void; index: number }) {
  const levelColor = stage.livelli?.color || "#888";
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group rounded-xl p-3 mb-2 border border-border bg-card hover:border-primary/30 hover:shadow-[0_0_20px_hsl(25_95%_53%/0.08)] transition-all duration-200 w-full text-left cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {stage.artist_image_url ? (
          <img
            src={stage.artist_image_url}
            alt={stage.artist}
            className="w-12 h-12 rounded-lg object-cover shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition-all"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <User size={18} className="text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={10} />
            {formatTime(stage.start_time)} – {formatTime(stage.end_time)}
          </div>
          <div className="font-heading font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors text-sm">
            {stage.artist}
          </div>
          <div className="text-xs text-muted-foreground truncate">{stage.title}</div>
        </div>
      </div>
      {stage.livelli && (
        <span
          className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
        >
          {stage.livelli.name}
        </span>
      )}
    </motion.button>
  );
}

export default function ScheduleGrid({ selectedDay, eventId }: { selectedDay: string; eventId?: string }) {
  const { data: sale } = useSale(eventId);
  const { data: stages } = useStages(eventId);
  const [selectedStage, setSelectedStage] = useState<StageWithRelations | null>(null);

  if (!sale || !stages) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />
      ))}
    </div>
  );

  const filtered = (stages as StageWithRelations[]).filter(
    (s) => s.giorno_id === selectedDay && (!eventId || s.evento_id === eventId)
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sale.map((room) => {
          const roomStages = filtered.filter((s) => s.sala_id === room.id);
          return (
            <div key={room.id} className="rounded-2xl bg-card border border-border p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: room.color }}
                />
                <h3
                  className="font-heading font-bold text-base"
                  style={{ color: room.color }}
                >
                  {room.name}
                </h3>
                <span className="ml-auto text-xs text-muted-foreground font-medium">
                  {roomStages.length} stage{roomStages.length !== 1 ? "s" : ""}
                </span>
              </div>
              {roomStages.length === 0 ? (
                <p className="text-muted-foreground/50 text-sm italic py-8 text-center">Nessuno stage</p>
              ) : (
                roomStages.map((s, i) => (
                  <StageBlock key={s.id} stage={s} onClick={() => setSelectedStage(s)} index={i} />
                ))
              )}
            </div>
          );
        })}
      </div>
      <StageDetailModal stage={selectedStage} open={!!selectedStage} onClose={() => setSelectedStage(null)} />
    </>
  );
}
