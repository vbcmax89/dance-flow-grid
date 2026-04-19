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
const MIN_BLOCK_PX = 76;
const BLOCK_GAP = 6;
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
  const compact = height < 64;
  const showTitle = height >= 88;
  const showLevel = height >= 72;

  return (
    <button
      onClick={onClick}
      className="group relative h-full w-full rounded-2xl overflow-hidden text-left transition-all duration-200 hover:brightness-110 hover:z-10"
      style={{
        background: `linear-gradient(160deg, #2a1a06 0%, #1a1106 100%)`,
        border: `1.5px solid ${lvl}55`,
        boxShadow: `0 2px 12px rgba(0,0,0,0.4), inset 0 0 0 1px ${lvl}20`,
      }}
    >
      {/* left accent */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-2xl"
        style={{ background: lvl, boxShadow: `2px 0 10px ${lvl}90` }}
      />

      {compact ? (
        <div className="absolute inset-0 pl-3.5 pr-2 flex items-center justify-between min-w-0 gap-1">
          <span className="font-bold truncate text-white" style={{ fontSize: 12 }}>
            {stage.artist}
          </span>
          <span className="text-[9px] font-mono shrink-0" style={{ color: lvl }}>
            {formatTime(stage.start_time)}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 pl-3.5 pr-2 pt-2 pb-2 flex flex-col justify-between min-w-0">
          {/* time */}
          <span className="text-[10px] font-mono" style={{ color: `${lvl}cc` }}>
            {formatTime(stage.start_time)}–{formatTime(stage.end_time)}
          </span>

          {/* artist + title */}
          <div className="flex flex-col min-w-0 mt-1">
            <span
              className="font-bold leading-tight text-white overflow-hidden"
              style={{
                fontSize: height >= 100 ? 16 : 14,
                display: "-webkit-box",
                WebkitLineClamp: height >= 110 ? 2 : 1,
                WebkitBoxOrient: "vertical",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {stage.artist}
            </span>
            {showTitle && (
              <span
                className="truncate mt-0.5 font-medium"
                style={{ fontSize: 11, color: lvl, fontStyle: "italic" }}
                title={stage.title}
              >
                {stage.title}
              </span>
            )}
          </div>

          {/* level pill */}
          {showLevel && stage.livelli && (
            <span
              className="self-start mt-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${lvl}25`, color: lvl, border: `1px solid ${lvl}60` }}
            >
              {stage.livelli.name}
            </span>
          )}
        </div>
      )}
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

  /* ---------- room color palette ---------- */
  const ROOM_PALETTE_FALLBACK = ["#B45309", "#065F46", "#1E3A5F"];
  const roomColorFor = (room: Tables<"sale">, idx: number) => {
    const n = room.name.toLowerCase();
    if (n.includes("alberobello")) return "#0D9488";
    if (n.includes("ostuni")) return "#1D4ED8";
    if (n.includes("polignano")) return "#7C3AED";
    if (n.includes("villaggio")) return "#BE185D";
    return ROOM_PALETTE_FALLBACK[idx % ROOM_PALETTE_FALLBACK.length];
  };
  const lighten = (hex: string, amt = 0.35) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c: number) => Math.round(c + (255 - c) * amt);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  /* ---------- shared building blocks ---------- */
  const TimeGutter = (
    <div
      className="relative sticky left-0 z-20"
      style={{
        width: GUTTER,
        backgroundColor: "#0a0a0a",
        borderRight: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      {halfMarks.map(({ m, isHour }) => {
        const top = ((m - minM) / SLOT) * ROW_PX;
        const hh = String(Math.floor((m % (24 * 60)) / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        return (
          <div
            key={m}
            className="absolute -translate-y-1/2 font-mono text-right"
            style={{
              top,
              right: 8,
              fontSize: 11,
              color: isHour ? "#C9A84C" : "rgba(201,168,76,0.55)",
              fontWeight: isHour ? 700 : 500,
            }}
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

  const RoomHeader = ({ room, idx }: { room: Tables<"sale">; idx: number }) => {
    const color = roomColorFor(room, idx);
    return (
      <div
        className="flex items-center justify-center gap-2.5 px-3 relative overflow-hidden"
        style={{
          height: 52,
          background: `linear-gradient(135deg, ${color}ff 0%, ${color}cc 60%, ${color}99 100%)`,
          borderBottom: `3px solid ${lighten(color, 0.3)}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px ${color}50`,
        }}
      >
        {/* glow spot */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.18) 0%, transparent 70%)` }}
        />
        <span
          className="w-2 h-2 rounded-full shrink-0 relative"
          style={{ backgroundColor: "#fff", boxShadow: `0 0 10px ${lighten(color, 0.6)}` }}
        />
        <h3
          className="font-heading font-extrabold uppercase tracking-widest truncate text-center relative"
          style={{ color: "#ffffff", fontSize: 13, textShadow: "0 1px 4px rgba(0,0,0,0.4)", letterSpacing: "0.12em" }}
        >
          {room.name}
        </h3>
      </div>
    );
  };

  /* ---------- DESKTOP LAYOUT ---------- */
  const renderDesktop = () => {
    const gridTemplateColumns = `${GUTTER}px repeat(${Math.max(rooms.length, 1)}, minmax(${COL_MIN_PX}px, 1fr))`;
    return (
      <div
        className="rounded-2xl bg-card/50 border border-gold/20 backdrop-blur-sm"
        style={{ overflow: "auto", maxHeight: "calc(100vh - 220px)" }}
      >
        <div style={{ minWidth: GUTTER + rooms.length * COL_MIN_PX }}>
          {/* sticky header row */}
          <div
            className="grid sticky top-0 z-20"
            style={{
              gridTemplateColumns,
              backgroundColor: "#0a0a0a",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {/* corner cell — top-left, must beat both axes */}
            <div
              className="sticky left-0 flex items-center justify-end pr-2 uppercase tracking-widest font-bold"
              style={{
                zIndex: 30,
                backgroundColor: "#0a0a0a",
                borderRight: "1px solid rgba(201,168,76,0.3)",
                borderBottom: "3px solid rgba(201,168,76,0.3)",
                color: "#C9A84C",
                fontSize: 10,
                height: 52,
              }}
            >
              Ora
            </div>
            {rooms.map((room, idx) => (
              <RoomHeader key={room.id} room={room} idx={idx} />
            ))}
          </div>

          {/* body */}
          <div className="relative grid" style={{ gridTemplateColumns, height: totalHeight }}>
            {TimeGutter}
            {rooms.map((room) => {
              const items = eventsByRoom.get(room.id) || [];
              const laid = assignLanes(items);
              return (
                <div key={room.id} className="relative border-l border-border/60" style={{ overflow: "visible" }}>
                  {RoomColumnBg}
                  {laid.map((it) => {
                    const { ev, lane, lanes } = it;
                    const top = (ev.start - minM) * PX_PER_MIN;
                    const height = computeBlockHeight(it, laid);
                    const laneWidthExpr = `calc((100% - 10px - ${(lanes - 1) * 5}px) / ${lanes})`;
                    const left = `calc(5px + ${lane} * (${laneWidthExpr} + 5px))`;
                    return (
                      <div
                        key={ev.stage.id}
                        className="absolute group/block"
                        style={{ top, height, left, width: laneWidthExpr, zIndex: 1 }}
                      >
                        <StageBlock stage={ev.stage} onClick={() => setSelectedStage(ev.stage)} height={height} />
                      </div>
                    );
                  })}
                </div>
              );
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
        RoomHeader={RoomHeader}
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
  totalHeight,
  TimeGutter,
  RoomColumnBg,
  RoomHeader,
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
  RoomHeader: (props: { room: Tables<"sale">; idx: number }) => JSX.Element;
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
    <div className="rounded-2xl bg-card/50 border border-gold/20" style={{ overflow: "auto", maxHeight: "calc(100vh - 220px)" }}>
      {/* room tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gold/20 bg-card sticky top-0 z-20">
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
          {rooms.map((room, idx) => {
            const items = eventsByRoom.get(room.id) || [];
            const laid = assignLanes(items);
            return (
              <div key={room.id} className="shrink-0 grow-0 basis-full min-w-0">
                <div
                  className="grid sticky top-[52px] z-20"
                  style={{
                    gridTemplateColumns: `${GUTTER}px 1fr`,
                    backgroundColor: "#0a0a0a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* corner cell */}
                  <div
                    className="flex items-center justify-end pr-2 uppercase tracking-widest font-bold"
                    style={{
                      backgroundColor: "#0a0a0a",
                      borderRight: "1px solid rgba(201,168,76,0.3)",
                      borderBottom: "3px solid rgba(201,168,76,0.3)",
                      color: "#C9A84C",
                      fontSize: 10,
                      height: 52,
                    }}
                  >
                    Ora
                  </div>
                  <RoomHeader room={room} idx={idx} />
                </div>

                <div className="relative grid" style={{ gridTemplateColumns: `${GUTTER}px 1fr`, height: totalHeight }}>
                  {TimeGutter}
                  <div className="relative border-l border-border/60" style={{ overflow: "visible" }}>
                    {RoomColumnBg}
                    {laid.map((it) => {
                      const { ev, lane, lanes } = it;
                      const top = (ev.start - minM) * PX_PER_MIN;
                      const height = computeBlockHeight(it, laid);
                      const laneWidthExpr = `calc((100% - 10px - ${(lanes - 1) * 5}px) / ${lanes})`;
                      const left = `calc(5px + ${lane} * (${laneWidthExpr} + 5px))`;
                      return (
                        <div
                          key={ev.stage.id}
                          className="absolute"
                          style={{ top, height, left, width: laneWidthExpr, zIndex: 1 }}
                        >
                          <StageBlock stage={ev.stage} onClick={() => onSelect(ev.stage)} height={height} />
                        </div>
                      );
                    })}
                  </div>

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
