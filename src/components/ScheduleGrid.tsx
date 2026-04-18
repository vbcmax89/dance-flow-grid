import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useSale, useStages } from "@/hooks/useScheduleData";
import { Tables } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";
import StageDetailModal from "./StageDetailModal";
import { Clock, Coffee, Utensils, UtensilsCrossed, Music, Trophy, Info, Waves, ChevronLeft, ChevronRight } from "lucide-react";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

const PX_PER_MIN = 2; // 1 minute = 2px (50min => 100px)
const SLOT = 1; // grid math step in minutes
const ROW_PX = PX_PER_MIN; // px per minute step
const GUTTER = 48;
const MIN_BLOCK_PX = 72;
const BLOCK_GAP = 4;
const COL_MIN_PX = 220;

function formatTime(t: string) {
  return t.slice(0, 5);
}
function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

type EventItem = { stage: StageWithRelations; start: number; end: number };

/* ---------- full-width type styling ---------- */
type FwStyle = { bg: string; accent: string; fg: string; Icon: any; emoji: string; italic?: boolean };

function fullWidthStyle(stage: StageWithRelations): FwStyle {
  const type = (stage as any).event_type || "special";
  const title = (stage.title || "").toLowerCase();

  if (title.includes("colazione")) return { bg: "#F59E0B", accent: "#92400E", fg: "#1a0f00", Icon: Coffee, emoji: "☕" };
  if (title.includes("pranzo")) return { bg: "#F97316", accent: "#9A3412", fg: "#1a0a00", Icon: Utensils, emoji: "🍴" };
  if (title.includes("cena")) return { bg: "#DC2626", accent: "#7F1D1D", fg: "#ffffff", Icon: UtensilsCrossed, emoji: "🍽️" };
  if (title.includes("pool")) return { bg: "#06B6D4", accent: "#0E7490", fg: "#062a30", Icon: Waves, emoji: "🦩" };

  switch (type) {
    case "break":
      return { bg: "#F59E0B", accent: "#92400E", fg: "#1a0f00", Icon: Utensils, emoji: "🍽️" };
    case "party":
      return { bg: "#7C3AED", accent: "#4C1D95", fg: "#ffffff", Icon: Music, emoji: "🎶" };
    case "competition":
      return { bg: "#92400E", accent: "#C9A84C", fg: "#ffffff", Icon: Trophy, emoji: "🏆" };
    case "info":
      return { bg: "#475569", accent: "#94A3B8", fg: "#e2e8f0", Icon: Info, emoji: "ℹ️", italic: true };
    default:
      return { bg: "hsl(var(--primary) / 0.25)", accent: "hsl(var(--gold))", fg: "hsl(var(--foreground))", Icon: Info, emoji: "✨" };
  }
}

/* ---------- overlap → lanes within a single room ---------- */
function assignLanes(events: EventItem[]) {
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const laneOf: number[] = [];
  sorted.forEach((ev) => {
    let lane = laneEnds.findIndex((end) => end <= ev.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(ev.end);
    } else {
      laneEnds[lane] = ev.end;
    }
    laneOf.push(lane);
  });
  return sorted.map((ev, i) => {
    let maxLane = laneOf[i];
    sorted.forEach((other, j) => {
      if (i === j) return;
      if (other.start < ev.end && other.end > ev.start) maxLane = Math.max(maxLane, laneOf[j]);
    });
    return { ev, lane: laneOf[i], lanes: maxLane + 1 };
  });
}

/** Compute rendered height for a laid-out item, clamping so it never
 *  overlaps the next item in the same lane and enforcing min height + 4px gap. */
function computeBlockHeight(
  item: { ev: EventItem; lane: number; lanes: number },
  all: { ev: EventItem; lane: number; lanes: number }[],
) {
  const { ev, lane } = item;
  const nextInLane = all
    .filter((o) => o !== item && o.lane === lane && o.ev.start >= ev.end)
    .sort((a, b) => a.ev.start - b.ev.start)[0];
  const cap = nextInLane ? (nextInLane.ev.start - ev.start) * PX_PER_MIN - BLOCK_GAP : Infinity;
  const natural = (ev.end - ev.start) * PX_PER_MIN - BLOCK_GAP;
  return Math.max(Math.min(natural, cap), MIN_BLOCK_PX);
}

/* ---------- stage block ---------- */
function StageBlock({
  stage,
  onClick,
  height,
}: {
  stage: StageWithRelations;
  onClick: () => void;
  height: number;
}) {
  const lvl = stage.livelli?.color || "#C9A84C";
  const showTitle = height >= 80;
  const artistLines = height >= 96 ? 2 : 1;
  return (
    <button
      onClick={onClick}
      className="group relative h-full w-full rounded-xl overflow-hidden text-left transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_22px_hsl(var(--gold)/0.35)] hover:ring-1 hover:ring-[hsl(var(--gold)/0.6)]"
      style={{
        background: `linear-gradient(180deg, ${lvl}30 0%, ${lvl}10 100%)`,
        border: `1px solid ${lvl}40`,
      }}
    >
      {/* left accent bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: lvl, boxShadow: `0 0 10px ${lvl}80` }}
      />

      {/* time top-left */}
      <div
        className="absolute left-3 top-1.5 flex items-center gap-1 text-[10px] font-mono text-foreground/60 leading-none pointer-events-none"
      >
        <Clock size={9} />
        <span>{formatTime(stage.start_time)}–{formatTime(stage.end_time)}</span>
      </div>

      {/* level badge bottom-right */}
      {stage.livelli && (
        <span
          className="absolute right-1.5 bottom-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full truncate max-w-[85%] pointer-events-none"
          style={{ backgroundColor: `${lvl}35`, color: lvl, border: `1px solid ${lvl}70` }}
        >
          {stage.livelli.name}
        </span>
      )}

      {/* center content */}
      <div className="absolute inset-x-0 top-7 bottom-7 px-3 flex flex-col justify-center min-w-0">
        <div
          className="font-heading font-bold text-foreground break-words overflow-hidden"
          style={{
            fontSize: 14,
            lineHeight: "16px",
            display: "-webkit-box",
            WebkitLineClamp: artistLines,
            WebkitBoxOrient: "vertical",
          }}
        >
          {stage.artist}
        </div>
        {showTitle && (
          <div
            className="italic text-foreground/70 mt-0.5 overflow-hidden whitespace-nowrap text-ellipsis"
            style={{ fontSize: 12, lineHeight: "14px" }}
            title={stage.title}
          >
            {stage.title}
          </div>
        )}
      </div>
    </button>
  );
}

/* ---------- full-width banner ---------- */
function FullWidthBlock({
  stage,
  top,
  height,
  left,
  right,
  onClick,
}: {
  stage: StageWithRelations;
  top: number;
  height: number;
  left: string;
  right: number;
  onClick: () => void;
}) {
  const s = fullWidthStyle(stage);
  return (
    <button
      onClick={onClick}
      className="absolute rounded-xl overflow-hidden flex items-center justify-center gap-3 px-4 transition hover:brightness-110 shadow-md"
      style={{
        top,
        height: Math.max(height, 56),
        left,
        right,
        background: `linear-gradient(90deg, ${s.accent}, ${s.bg} 35%, ${s.bg})`,
        color: s.fg,
        borderLeft: `4px solid ${s.accent}`,
      }}
    >
      <span className="text-base shrink-0">{s.emoji}</span>
      <span className="text-[10px] font-mono opacity-75 shrink-0">
        {formatTime(stage.start_time)}
        {stage.end_time && stage.end_time !== stage.start_time ? `–${formatTime(stage.end_time)}` : ""}
      </span>
      <span
        className={`font-heading font-bold tracking-wide uppercase text-sm text-center ${s.italic ? "italic font-medium normal-case" : ""}`}
        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {stage.title}
      </span>
    </button>
  );
}

/* ---------- main ---------- */
export default function ScheduleGrid({ selectedDay, eventId }: { selectedDay: string; eventId?: string }) {
  const { data: sale } = useSale(eventId);
  const { data: stages } = useStages(eventId);
  const isMobile = useIsMobile();
  const [selectedStage, setSelectedStage] = useState<StageWithRelations | null>(null);

  if (!sale || !stages) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const dayStages = (stages as StageWithRelations[]).filter(
    (s) => s.giorno_id === selectedDay && (!eventId || s.evento_id === eventId)
  );

  if (dayStages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gold/30 py-20 text-center text-muted-foreground/60 italic animate-day-fade">
        Programma in arrivo…
      </div>
    );
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

  const totalHeight = ((maxM - minM) / SLOT) * ROW_PX;

  // Half-hour ticks; full hour = stronger label
  const halfMarks: { m: number; isHour: boolean }[] = [];
  const firstHalf = Math.ceil(minM / 30) * 30;
  for (let m = firstHalf; m <= maxM; m += 30) halfMarks.push({ m, isHour: m % 60 === 0 });

  const fullWidth = events.filter((e) => (e.stage as any).is_full_width);
  const roomEvents = events.filter((e) => !(e.stage as any).is_full_width && e.stage.sala_id);

  const eventsByRoom = new Map<string, EventItem[]>();
  roomEvents.forEach((e) => {
    const k = e.stage.sala_id!;
    if (!eventsByRoom.has(k)) eventsByRoom.set(k, []);
    eventsByRoom.get(k)!.push(e);
  });

  /* ---------- shared building blocks ---------- */
  const TimeGutter = (
    <div className="relative border-r border-border bg-card sticky left-0 z-10" style={{ width: GUTTER }}>
      {halfMarks.map(({ m, isHour }) => {
        const top = ((m - minM) / SLOT) * ROW_PX;
        const hh = String(Math.floor((m % (24 * 60)) / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        return (
          <div
            key={m}
            className={`absolute right-2 -translate-y-1/2 font-mono ${
              isHour ? "text-[11px] text-gold font-bold" : "text-[9px] text-muted-foreground/60"
            }`}
            style={{ top }}
          >
            {hh}:{mm}
          </div>
        );
      })}
    </div>
  );

  const RoomColumnBg = (
    <>
      {halfMarks.map(({ m, isHour }) => {
        const top = ((m - minM) / SLOT) * ROW_PX;
        return (
          <div
            key={m}
            className={`absolute left-0 right-0 ${isHour ? "border-t border-border/50" : "border-t border-border/20"}`}
            style={{ top }}
          />
        );
      })}
    </>
  );

  const RoomHeader = ({ room }: { room: Tables<"sale"> }) => (
    <div
      className="px-3 py-3 flex items-center gap-2 border-l border-border bg-card border-b border-gold/30"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: room.color, boxShadow: `0 0 8px ${room.color}` }} />
      <h3 className="font-heading font-bold text-xs uppercase tracking-widest truncate text-gold">
        {room.name}
      </h3>
    </div>
  );

  /* ---------- DESKTOP LAYOUT ---------- */
  const renderDesktop = () => {
    const gridTemplateColumns = `${GUTTER}px repeat(${Math.max(rooms.length, 1)}, minmax(180px, 1fr))`;
    return (
      <div className="rounded-2xl bg-card/50 border border-gold/20 overflow-x-auto backdrop-blur-sm">
        <div style={{ minWidth: GUTTER + rooms.length * 180 }}>
          {/* sticky header */}
          <div className="grid sticky top-[120px] z-20 bg-card" style={{ gridTemplateColumns }}>
            <div className="px-2 py-3 text-[10px] uppercase tracking-widest text-gold font-bold sticky left-0 bg-card z-10 border-b border-gold/30">
              Ora
            </div>
            {rooms.map((room) => (
              <RoomHeader key={room.id} room={room} />
            ))}
          </div>

          {/* body */}
          <div className="relative grid" style={{ gridTemplateColumns, height: totalHeight }}>
            {TimeGutter}
            {rooms.map((room) => (
              <div key={room.id} className="relative border-l border-border/60">
                {RoomColumnBg}
              </div>
            ))}

            {/* room stages */}
            {rooms.map((room, roomIdx) => {
              const items = eventsByRoom.get(room.id) || [];
              const laid = assignLanes(items);
              const colWidth = `calc((100% - ${GUTTER}px) / ${rooms.length})`;
              return laid.map((it) => {
                const { ev, lane, lanes } = it;
                const top = (ev.start - minM) * PX_PER_MIN;
                const height = computeBlockHeight(it, laid);
                const laneWidthExpr = `calc((${colWidth} - 8px - ${(lanes - 1) * 4}px) / ${lanes})`;
                const left = `calc(${GUTTER}px + ${roomIdx} * ${colWidth} + 4px + ${lane} * (${laneWidthExpr} + 4px))`;
                return (
                  <div
                    key={ev.stage.id}
                    className="absolute"
                    style={{ top, height, left, width: laneWidthExpr }}
                  >
                    <StageBlock stage={ev.stage} onClick={() => setSelectedStage(ev.stage)} height={height} />
                  </div>
                );
              });
            })}

            {/* full-width */}
            {fullWidth.map(({ stage, start, end }) => {
              const top = ((start - minM) / SLOT) * ROW_PX + 1;
              const height = ((end - start) / SLOT) * ROW_PX - 2;
              return (
                <FullWidthBlock
                  key={stage.id}
                  stage={stage}
                  top={top}
                  height={height}
                  left={`calc(${GUTTER}px + 4px)`}
                  right={4}
                  onClick={() => setSelectedStage(stage)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- MOBILE LAYOUT (swipe per room) ---------- */
  const renderMobile = () => {
    return (
      <MobileSchedule
        rooms={rooms}
        eventsByRoom={eventsByRoom}
        fullWidth={fullWidth}
        minM={minM}
        halfMarks={halfMarks}
        totalHeight={totalHeight}
        TimeGutter={TimeGutter}
        RoomColumnBg={RoomColumnBg}
        onSelect={setSelectedStage}
      />
    );
  };

  return (
    <>
      <div key={selectedDay} className="animate-day-fade">
        {isMobile ? renderMobile() : renderDesktop()}
      </div>
      <StageDetailModal stage={selectedStage} open={!!selectedStage} onClose={() => setSelectedStage(null)} />
    </>
  );
}

/* ---------- mobile carousel component ---------- */
function MobileSchedule({
  rooms,
  eventsByRoom,
  fullWidth,
  minM,
  halfMarks,
  totalHeight,
  TimeGutter,
  RoomColumnBg,
  onSelect,
}: {
  rooms: Tables<"sale">[];
  eventsByRoom: Map<string, EventItem[]>;
  fullWidth: EventItem[];
  minM: number;
  halfMarks: { m: number; isHour: boolean }[];
  totalHeight: number;
  TimeGutter: JSX.Element;
  RoomColumnBg: JSX.Element;
  onSelect: (s: StageWithRelations) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSel = () => setActive(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSel);
    onSel();
    return () => {
      emblaApi.off("select", onSel);
    };
  }, [emblaApi]);

  if (rooms.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card/50 border border-gold/20 overflow-hidden">
      {/* room tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gold/20 bg-card sticky top-[120px] z-20">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="p-1 text-gold/70 hover:text-gold disabled:opacity-30"
          disabled={active === 0}
          aria-label="Sala precedente"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar justify-center">
          {rooms.map((r, i) => {
            const a = i === active;
            return (
              <button
                key={r.id}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition border ${
                  a
                    ? "bg-gold text-[hsl(var(--gold-foreground))] border-gold"
                    : "bg-transparent text-gold/70 border-gold/30"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="p-1 text-gold/70 hover:text-gold disabled:opacity-30"
          disabled={active === rooms.length - 1}
          aria-label="Sala successiva"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {rooms.map((room) => {
            const items = eventsByRoom.get(room.id) || [];
            const laid = assignLanes(items);
            return (
              <div key={room.id} className="shrink-0 grow-0 basis-full min-w-0">
                <div className="grid" style={{ gridTemplateColumns: `${GUTTER}px 1fr` }}>
                  {/* header */}
                  <div className="px-2 py-2 text-[10px] uppercase tracking-widest text-gold font-bold border-b border-gold/30 bg-card">
                    Ora
                  </div>
                  <div className="px-3 py-2 flex items-center gap-2 border-l border-border bg-card border-b border-gold/30">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: room.color, boxShadow: `0 0 8px ${room.color}` }} />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-gold truncate">
                      {room.name}
                    </h3>
                  </div>
                </div>

                <div className="relative grid" style={{ gridTemplateColumns: `${GUTTER}px 1fr`, height: totalHeight }}>
                  {TimeGutter}
                  <div className="relative border-l border-border/60">{RoomColumnBg}</div>

                  {laid.map((it) => {
                    const { ev, lane, lanes } = it;
                    const top = (ev.start - minM) * PX_PER_MIN;
                    const height = computeBlockHeight(it, laid);
                    const laneWidthExpr = `calc((100% - ${GUTTER}px - 8px - ${(lanes - 1) * 4}px) / ${lanes})`;
                    const left = `calc(${GUTTER}px + 4px + ${lane} * (${laneWidthExpr} + 4px))`;
                    return (
                      <div
                        key={ev.stage.id}
                        className="absolute"
                        style={{ top, height, left, width: laneWidthExpr }}
                      >
                        <StageBlock stage={ev.stage} onClick={() => onSelect(ev.stage)} height={height} />
                      </div>
                    );
                  })}

                  {/* full-width banners on every slide */}
                  {fullWidth.map(({ stage, start, end }) => {
                    const top = ((start - minM) / SLOT) * ROW_PX + 1;
                    const height = ((end - start) / SLOT) * ROW_PX - 2;
                    return (
                      <FullWidthBlock
                        key={stage.id}
                        stage={stage}
                        top={top}
                        height={height}
                        left={`calc(${GUTTER}px + 4px)`}
                        right={4}
                        onClick={() => onSelect(stage)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
