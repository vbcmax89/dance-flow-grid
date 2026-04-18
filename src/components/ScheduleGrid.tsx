import { useState } from "react";
import { useSale, useStages } from "@/hooks/useScheduleData";
import { Tables } from "@/integrations/supabase/types";
import StageDetailModal from "./StageDetailModal";
import { Clock, Utensils, PartyPopper, Trophy, Info } from "lucide-react";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

const SLOT = 15; // minutes per row
const ROW_PX = 16; // px per slot -> 64px/h
const GUTTER = 64;
const MIN_BLOCK_PX = 60;

type EventItem = {
  stage: StageWithRelations;
  start: number;
  end: number;
};

function StageBlock({
  stage,
  onClick,
  compact,
}: {
  stage: StageWithRelations;
  onClick: () => void;
  compact?: boolean;
}) {
  const levelColor = stage.livelli?.color || "#888";
  return (
    <button
      onClick={onClick}
      className="group h-full w-full rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-[0_0_18px_hsl(var(--primary)/0.18)] transition-all duration-200 text-left cursor-pointer overflow-hidden flex flex-col p-2"
      style={{ padding: 8 }}
    >
      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground leading-none">
        <Clock size={9} />
        <span>{formatTime(stage.start_time)}</span>
      </div>
      <div
        className="font-heading font-bold text-foreground leading-tight mt-1 break-words"
        style={{ fontSize: 13, lineHeight: "15px" }}
      >
        {stage.artist}
      </div>
      {!compact && (
        <div
          className="italic text-foreground/85 mt-0.5 overflow-hidden"
          style={{
            fontSize: 11,
            lineHeight: "13px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {stage.title}
        </div>
      )}
      {stage.livelli && (
        <span
          className="self-end mt-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full truncate max-w-full"
          style={{ backgroundColor: `${levelColor}30`, color: levelColor, border: `1px solid ${levelColor}55` }}
        >
          {stage.livelli.name}
        </span>
      )}
    </button>
  );
}

// type-specific styling for full-width blocks
function fullWidthStyle(type: string) {
  switch (type) {
    case "break":
      return {
        bg: "#F28B82",
        accent: "#B5443B",
        fg: "#2a0a08",
        Icon: Utensils,
        italic: false,
      };
    case "party":
      return {
        bg: "#4A1070",
        accent: "#C9A84C",
        fg: "#ffffff",
        Icon: PartyPopper,
        italic: false,
      };
    case "competition":
      return {
        bg: "#8B6914",
        accent: "#C9A84C",
        fg: "#ffffff",
        Icon: Trophy,
        italic: false,
      };
    case "info":
      return {
        bg: "#3a3a3a",
        accent: "#888888",
        fg: "#e5e5e5",
        Icon: Info,
        italic: true,
      };
    default:
      return {
        bg: "hsl(var(--primary) / 0.2)",
        accent: "hsl(var(--primary))",
        fg: "hsl(var(--primary))",
        Icon: Info,
        italic: false,
      };
  }
}

// Lay out overlapping events in a column into side-by-side lanes
function assignLanes(events: EventItem[]) {
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const result: { ev: EventItem; lane: number; lanes: number }[] = [];

  // First pass: assign each event to first lane that's free
  const tempLanes: number[] = [];
  sorted.forEach((ev) => {
    let lane = laneEnds.findIndex((end) => end <= ev.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(ev.end);
    } else {
      laneEnds[lane] = ev.end;
    }
    tempLanes.push(lane);
  });

  // Group by overlapping cluster to compute total lanes per event
  // Simple approach: for each event, count max lanes used by anything overlapping it
  sorted.forEach((ev, i) => {
    let maxLane = tempLanes[i];
    sorted.forEach((other, j) => {
      if (i === j) return;
      const overlaps = other.start < ev.end && other.end > ev.start;
      if (overlaps) maxLane = Math.max(maxLane, tempLanes[j]);
    });
    result.push({ ev, lane: tempLanes[i], lanes: maxLane + 1 });
  });

  return result;
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

  const usedRoomIds = new Set(
    dayStages.filter((s) => !(s as any).is_full_width && s.sala_id).map((s) => s.sala_id)
  );
  const rooms = sale.filter((r) => usedRoomIds.has(r.id));

  const hasLate = dayStages.some((s) => toMin(s.start_time) >= 20 * 60);
  const adj = (t: number) => (hasLate && t < 6 * 60 ? t + 24 * 60 : t);

  const events: EventItem[] = dayStages.map((s) => {
    let start = adj(toMin(s.start_time));
    let end = adj(toMin(s.end_time));
    if (end <= start) end = start + 60;
    return { stage: s, start, end };
  });

  let minM = Math.min(...events.map((e) => e.start));
  let maxM = Math.max(...events.map((e) => e.end));
  minM = Math.floor(minM / SLOT) * SLOT;
  maxM = Math.ceil(maxM / SLOT) * SLOT;

  const totalSlots = (maxM - minM) / SLOT;
  const totalHeight = totalSlots * ROW_PX;

  const hourMarks: number[] = [];
  const firstHour = Math.ceil(minM / 60) * 60;
  for (let m = firstHour; m <= maxM; m += 60) hourMarks.push(m);

  const fullWidth = events.filter((e) => (e.stage as any).is_full_width);
  const roomEvents = events.filter((e) => !(e.stage as any).is_full_width && e.stage.sala_id);

  // Group room events by sala and compute lanes for overlap handling
  const eventsByRoom = new Map<string, EventItem[]>();
  roomEvents.forEach((e) => {
    const k = e.stage.sala_id!;
    if (!eventsByRoom.has(k)) eventsByRoom.set(k, []);
    eventsByRoom.get(k)!.push(e);
  });

  const gridTemplateColumns = `${GUTTER}px repeat(${Math.max(rooms.length, 1)}, minmax(0, 1fr))`;

  return (
    <>
      <div className="rounded-2xl bg-card border border-border overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Sticky header */}
          <div
            className="grid sticky top-[120px] z-20 bg-card border-b border-border"
            style={{ gridTemplateColumns }}
          >
            <div className="px-2 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold sticky left-0 bg-card z-10">
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

          {/* Body */}
          <div className="relative grid" style={{ gridTemplateColumns, height: totalHeight }}>
            {/* Time gutter (sticky horizontally) */}
            <div className="relative border-r border-border sticky left-0 bg-card z-10">
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

            {/* Room columns + gridlines */}
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

            {/* Stage blocks per room with lane handling */}
            {rooms.map((room, roomIdx) => {
              const items = eventsByRoom.get(room.id) || [];
              const laid = assignLanes(items);
              const colWidth = `calc((100% - ${GUTTER}px) / ${rooms.length})`;
              return laid.map(({ ev, lane, lanes }) => {
                const top = ((ev.start - minM) / SLOT) * ROW_PX;
                const rawHeight = ((ev.end - ev.start) / SLOT) * ROW_PX;
                const height = Math.max(rawHeight - 4, MIN_BLOCK_PX);
                const laneWidthExpr = `calc((${colWidth} - 8px - ${(lanes - 1) * 4}px) / ${lanes})`;
                const left = `calc(${GUTTER}px + ${roomIdx} * ${colWidth} + 4px + ${lane} * (${laneWidthExpr} + 4px))`;
                return (
                  <div
                    key={ev.stage.id}
                    className="absolute"
                    style={{ top: top + 2, height, left, width: laneWidthExpr }}
                  >
                    <StageBlock
                      stage={ev.stage}
                      onClick={() => setSelectedStage(ev.stage)}
                      compact={lanes > 1}
                    />
                  </div>
                );
              });
            })}

            {/* Full-width blocks */}
            {fullWidth.map(({ stage, start, end }) => {
              const t = (stage as any).event_type || "special";
              const style = fullWidthStyle(t);
              const Icon = style.Icon;
              const top = ((start - minM) / SLOT) * ROW_PX;
              const rawHeight = ((end - start) / SLOT) * ROW_PX;
              const height = Math.max(rawHeight - 2, 50);
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage)}
                  className="absolute rounded-lg overflow-hidden flex items-center gap-3 hover:opacity-95 transition shadow-md"
                  style={{
                    top: top + 1,
                    height,
                    left: `calc(${GUTTER}px + 4px)`,
                    right: 4,
                    background: style.bg,
                    color: style.fg,
                    borderLeft: `4px solid ${style.accent}`,
                    paddingLeft: 12,
                    paddingRight: 12,
                  }}
                >
                  <Icon size={16} className="shrink-0 opacity-90" />
                  <span className="text-[11px] font-mono opacity-80 shrink-0">
                    {formatTime(stage.start_time)}
                    {stage.end_time && stage.end_time !== stage.start_time ? `–${formatTime(stage.end_time)}` : ""}
                  </span>
                  <span
                    className={`flex-1 text-center font-bold tracking-wide uppercase text-sm truncate ${style.italic ? "italic font-medium normal-case" : ""}`}
                  >
                    {stage.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest opacity-70 shrink-0">{t}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <StageDetailModal stage={selectedStage} open={!!selectedStage} onClose={() => setSelectedStage(null)} />
    </>
  );
}
