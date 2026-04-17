import { useState } from "react";
import { useSale, useStages } from "@/hooks/useScheduleData";
import { Tables } from "@/integrations/supabase/types";
import StageDetailModal from "./StageDetailModal";
import { Clock, User } from "lucide-react";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

// minutes from midnight; supports overnight (end < start) by adding 24h
function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

const SLOT = 15; // minutes per grid row
const ROW_PX = 14; // px per slot -> 56px per hour

function StageBlock({ stage, onClick }: { stage: StageWithRelations; onClick: () => void }) {
  const levelColor = stage.livelli?.color || "#888";
  return (
    <button
      onClick={onClick}
      className="group h-full w-full rounded-xl p-2.5 border border-border bg-card hover:border-primary/40 hover:shadow-[0_0_20px_hsl(25_95%_53%/0.1)] transition-all duration-200 text-left cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="flex items-center gap-2 min-w-0">
        {stage.artist_image_url ? (
          <img
            src={stage.artist_image_url}
            alt={stage.artist}
            className="w-9 h-9 rounded-md object-cover shrink-0 ring-1 ring-border group-hover:ring-primary/40 transition-all"
          />
        ) : (
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
            <User size={14} className="text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={9} />
            {formatTime(stage.start_time)}–{formatTime(stage.end_time)}
          </div>
          <div className="font-heading font-bold text-foreground text-xs leading-tight group-hover:text-primary transition-colors truncate">
            {stage.artist}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground truncate mt-1">{stage.title}</div>
      {stage.livelli && (
        <span
          className="inline-block mt-auto self-start text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${levelColor}25`, color: levelColor }}
        >
          {stage.livelli.name}
        </span>
      )}
    </button>
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

  const dayStages = (stages as StageWithRelations[]).filter(
    (s) => s.giorno_id === selectedDay && (!eventId || s.evento_id === eventId)
  );

  if (dayStages.length === 0) {
    return <p className="text-muted-foreground/60 italic text-center py-12">Nessuno stage in programma</p>;
  }

  // Only show rooms that have at least one non-fullwidth stage
  const usedRoomIds = new Set(
    dayStages.filter((s) => !(s as any).is_full_width && s.sala_id).map((s) => s.sala_id)
  );
  const rooms = sale.filter((r) => usedRoomIds.has(r.id));

  // Compute time bounds. Treat times < earliest morning as "next day" for overnight events.
  const rawTimes = dayStages.flatMap((s) => {
    const a = toMin(s.start_time);
    const b = toMin(s.end_time);
    return [a, b];
  });
  // Heuristic: if there are events crossing midnight (end < start) we extend, but keep simple:
  let minM = Math.min(...rawTimes);
  let maxM = Math.max(...rawTimes);

  // adjust overnight: any stage where end<=start gets end += 1440
  // and if start is small (e.g. 00:00) but a later stage exists, treat it as +1440
  // Simple approach: any time ≤ 6:00 when there are events after 20:00 -> +1440
  const hasLate = dayStages.some((s) => toMin(s.start_time) >= 20 * 60);
  const adj = (t: number) => (hasLate && t < 6 * 60 ? t + 24 * 60 : t);

  const events = dayStages.map((s) => {
    let start = adj(toMin(s.start_time));
    let end = adj(toMin(s.end_time));
    if (end <= start) end = start + 60; // safety
    return { stage: s, start, end };
  });

  minM = Math.min(...events.map((e) => e.start));
  maxM = Math.max(...events.map((e) => e.end));
  // snap to slot
  minM = Math.floor(minM / SLOT) * SLOT;
  maxM = Math.ceil(maxM / SLOT) * SLOT;

  const totalSlots = (maxM - minM) / SLOT;
  const totalHeight = totalSlots * ROW_PX;

  // Hour ticks for time gutter
  const hourMarks: number[] = [];
  const firstHour = Math.ceil(minM / 60) * 60;
  for (let m = firstHour; m <= maxM; m += 60) hourMarks.push(m);

  const fullWidth = events.filter((e) => (e.stage as any).is_full_width);
  const roomEvents = events.filter((e) => !(e.stage as any).is_full_width && e.stage.sala_id);

  const typeStyles: Record<string, string> = {
    break: "from-amber-900/40 to-amber-700/20 border-amber-600/50 text-amber-100",
    party: "from-fuchsia-900/40 to-purple-700/20 border-fuchsia-500/50 text-fuchsia-100",
    info: "from-sky-900/40 to-sky-700/20 border-sky-500/50 text-sky-100",
    competition: "from-red-900/40 to-orange-700/20 border-red-500/50 text-red-100",
    special: "from-primary/25 to-primary/5 border-primary/50 text-primary",
  };

  const slotsBetween = (a: number, b: number) => (a - b) / SLOT; // returns slot index

  // Grid: gutter (60px) + N room columns
  const gridTemplateColumns = `60px repeat(${Math.max(rooms.length, 1)}, minmax(0, 1fr))`;

  return (
    <>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {/* Sticky header row */}
        <div
          className="grid sticky top-[120px] z-20 bg-card border-b border-border"
          style={{ gridTemplateColumns }}
        >
          <div className="px-2 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Ora
          </div>
          {rooms.map((room) => (
            <div key={room.id} className="px-3 py-3 flex items-center gap-2 border-l border-border">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
              <h3 className="font-heading font-bold text-sm truncate" style={{ color: room.color }}>
                {room.name}
              </h3>
            </div>
          ))}
        </div>

        {/* Body grid */}
        <div className="relative grid" style={{ gridTemplateColumns, height: totalHeight }}>
          {/* Time gutter with hour marks */}
          <div className="relative border-r border-border">
            {hourMarks.map((m) => {
              const top = ((m - minM) / SLOT) * ROW_PX;
              const hh = String(Math.floor((m % (24 * 60)) / 60)).padStart(2, "0");
              return (
                <div
                  key={m}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground"
                  style={{ top }}
                >
                  {hh}:00
                </div>
              );
            })}
          </div>

          {/* Room columns with hour gridlines */}
          {rooms.map((room) => (
            <div key={room.id} className="relative border-l border-border">
              {hourMarks.map((m) => {
                const top = ((m - minM) / SLOT) * ROW_PX;
                return (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t border-border/40"
                    style={{ top }}
                  />
                );
              })}
            </div>
          ))}

          {/* Absolutely positioned room stages */}
          {roomEvents.map(({ stage, start, end }) => {
            const colIdx = rooms.findIndex((r) => r.id === stage.sala_id);
            if (colIdx === -1) return null;
            const top = ((start - minM) / SLOT) * ROW_PX;
            const height = ((end - start) / SLOT) * ROW_PX;
            // column position: gutter is column 1, rooms start at column 2
            const colWidth = `calc((100% - 60px) / ${rooms.length})`;
            const left = `calc(60px + ${colIdx} * ${colWidth} + 4px)`;
            const width = `calc(${colWidth} - 8px)`;
            return (
              <div
                key={stage.id}
                className="absolute"
                style={{ top: top + 2, height: height - 4, left, width }}
              >
                <StageBlock stage={stage} onClick={() => setSelectedStage(stage)} />
              </div>
            );
          })}

          {/* Full-width special blocks: span all room columns */}
          {fullWidth.map(({ stage, start, end }) => {
            const t = (stage as any).event_type || "special";
            const cls = typeStyles[t] || typeStyles.special;
            const top = ((start - minM) / SLOT) * ROW_PX;
            const height = ((end - start) / SLOT) * ROW_PX;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className={`absolute rounded-lg border bg-gradient-to-r ${cls} px-4 flex items-center gap-3 hover:opacity-90 transition shadow-md backdrop-blur-sm`}
                style={{
                  top: top + 1,
                  height: Math.max(height - 2, 28),
                  left: "calc(60px + 4px)",
                  right: 4,
                }}
              >
                <Clock size={13} className="opacity-70 shrink-0" />
                <span className="text-[11px] font-mono opacity-80 shrink-0">
                  {formatTime(stage.start_time)}
                  {stage.end_time && stage.end_time !== stage.start_time ? `–${formatTime(stage.end_time)}` : ""}
                </span>
                <span className="font-heading font-bold tracking-wide uppercase text-sm truncate">
                  {stage.title}
                </span>
                <span className="ml-auto text-[10px] uppercase tracking-widest opacity-60 shrink-0">{t}</span>
              </button>
            );
          })}
        </div>
      </div>
      <StageDetailModal stage={selectedStage} open={!!selectedStage} onClose={() => setSelectedStage(null)} />
    </>
  );
}
