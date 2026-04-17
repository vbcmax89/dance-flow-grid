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

  const fullWidth = filtered.filter((s) => (s as any).is_full_width);
  const roomStagesAll = filtered.filter((s) => !(s as any).is_full_width);

  const typeStyles: Record<string, string> = {
    break: "from-amber-900/30 to-amber-700/10 border-amber-600/40 text-amber-100",
    party: "from-fuchsia-900/30 to-purple-700/10 border-fuchsia-500/40 text-fuchsia-100",
    info: "from-sky-900/30 to-sky-700/10 border-sky-500/40 text-sky-100",
    competition: "from-red-900/30 to-orange-700/10 border-red-500/40 text-red-100",
    special: "from-primary/20 to-primary/5 border-primary/40 text-primary",
  };

  return (
    <>
      {fullWidth.length > 0 && (
        <div className="space-y-2 mb-6">
          {fullWidth
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((s) => {
              const t = (s as any).event_type || "special";
              const cls = typeStyles[t] || typeStyles.special;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStage(s)}
                  className={`w-full text-left rounded-xl border bg-gradient-to-r ${cls} px-4 py-3 flex items-center gap-3 hover:opacity-90 transition`}
                >
                  <Clock size={14} className="opacity-70 shrink-0" />
                  <span className="text-xs font-mono opacity-80 shrink-0">
                    {formatTime(s.start_time)}{s.end_time && s.end_time !== s.start_time ? `–${formatTime(s.end_time)}` : ""}
                  </span>
                  <span className="font-heading font-bold tracking-wide uppercase text-sm">
                    {s.title}
                  </span>
                  <span className="ml-auto text-[10px] uppercase tracking-widest opacity-60">{t}</span>
                </button>
              );
            })}
        </div>
      )}
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
