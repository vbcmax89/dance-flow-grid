import { Link } from "react-router-dom";
import { Settings, ChevronDown, Music, Instagram, Facebook, Youtube } from "lucide-react";
import { useEventi } from "@/hooks/useScheduleData";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";

type EventStatus = "active" | "upcoming" | "past";

function getStatus(start?: string | null, end?: string | null): EventStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : s;
  if (s && e && today >= s && today <= e) return "active";
  if (s && today < s) return "upcoming";
  if (e && today > e) return "past";
  return "upcoming";
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt(start || end!);
}

export default function Index() {
  const { data: eventi, isLoading } = useEventi();
  const eventsRef = useRef<HTMLDivElement>(null);

  const { hero, current, past } = useMemo(() => {
    const list = eventi || [];
    const withStatus = list.map((e) => ({ ...e, _status: getStatus(e.start_date, e.end_date) }));
    const active = withStatus.find((e) => e._status === "active");
    const upcoming = withStatus.filter((e) => e._status === "upcoming");
    const heroPick = active || upcoming[0] || withStatus[0];
    return {
      hero: heroPick,
      current: withStatus.filter((e) => e._status !== "past"),
      past: withStatus.filter((e) => e._status === "past"),
    };
  }, [eventi]);

  const scrollToEvents = () => eventsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      {/* HERO */}
      <section className="relative h-screen w-full overflow-hidden">
        {hero?.cover_image_url ? (
          <img
            src={hero.cover_image_url}
            alt={hero.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]" />
        )}

        {/* Dark gradient overlay (stronger at bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-black" />

        {/* Shimmer behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#C9A84C]/10 blur-[140px] animate-shimmer pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-[11px] md:text-xs tracking-[0.4em] uppercase text-[#C9A84C] mb-6 font-medium"
          >
            Be Fusion presenta
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display font-bold text-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.95] tracking-tight max-w-5xl"
          >
            {hero?.name || "Be Fusion"}
          </motion.h1>

          {hero && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-6 text-[#C9A84C] text-base md:text-lg tracking-wide"
            >
              {formatDateRange(hero.start_date, hero.end_date)}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10"
          >
            {hero ? (
              <Link
                to={`/event/${hero.id}`}
                className="inline-block px-8 py-3.5 rounded-md bg-[#C9A84C] text-black text-sm font-semibold tracking-wider uppercase border border-[#C9A84C] transition-all duration-300 hover:bg-transparent hover:text-[#C9A84C]"
              >
                Scopri il Planning
              </Link>
            ) : (
              <button
                onClick={scrollToEvents}
                className="inline-block px-8 py-3.5 rounded-md bg-[#C9A84C] text-black text-sm font-semibold tracking-wider uppercase border border-[#C9A84C] transition-all duration-300 hover:bg-transparent hover:text-[#C9A84C]"
              >
                Vedi gli eventi
              </button>
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToEvents}
          aria-label="Scorri agli eventi"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#C9A84C] animate-bounce-down"
        >
          <ChevronDown size={32} strokeWidth={1.5} />
        </button>
      </section>

      {/* EVENTS */}
      <section ref={eventsRef} className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="font-display font-bold text-[#C9A84C] text-center text-4xl md:text-6xl mb-4"
        >
          I Nostri Eventi
        </motion.h2>
        <div className="w-16 h-px bg-[#C9A84C]/50 mx-auto mb-16" />

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-lg bg-[#111] animate-pulse" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {current.map((ev, i) => (
            <EventCard key={ev.id} ev={ev} index={i} />
          ))}
        </div>

        {past.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center gap-6 mb-12">
              <div className="flex-1 h-px bg-[#C9A84C]/30" />
              <span className="font-display italic text-[#C9A84C]/70 text-sm tracking-widest uppercase">
                Edizioni precedenti
              </span>
              <div className="flex-1 h-px bg-[#C9A84C]/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {past.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} index={i} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && (eventi?.length ?? 0) === 0 && (
          <div className="text-center py-20">
            <Music className="mx-auto text-[#C9A84C]/30 mb-4" size={48} />
            <p className="text-muted-foreground">Nessun evento ancora.</p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0a] border-t border-[#C9A84C]/30">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-6">
          <div className="font-display text-2xl text-[#C9A84C] tracking-wide">Be Fusion</div>
          <div className="flex items-center gap-6">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-[#C9A84C] transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-[#C9A84C] transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" aria-label="Youtube" className="text-muted-foreground hover:text-[#C9A84C] transition-colors">
              <Youtube size={20} />
            </a>
          </div>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Be Fusion. Tutti i diritti riservati.
          </p>
        </div>
      </footer>

      {/* Admin link (preserved) */}
      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/60 bg-[#111]/80 backdrop-blur-sm border border-[#C9A84C]/20 hover:text-[#C9A84C] hover:border-[#C9A84C]/60 transition-all"
      >
        <Settings size={14} />
        Admin
      </Link>
    </div>
  );
}

function EventCard({ ev, index }: { ev: any; index: number }) {
  const status: EventStatus = ev._status;
  const isPast = status === "past";

  const cardInner = (
    <div
      className={[
        "group relative rounded-lg overflow-hidden border bg-[#111] transition-all duration-500",
        isPast
          ? "border-[#222] grayscale-[0.6] opacity-70 cursor-not-allowed"
          : "border-[#C9A84C]/20 hover:border-[#C9A84C] hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(201,168,76,0.4)]",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
        {ev.cover_image_url ? (
          <img
            src={ev.cover_image_url}
            alt={ev.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
            <Music className="text-[#C9A84C]/30" size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/30 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4">
          {status === "active" && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-[#C9A84C]/40">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-gold-pulse" />
              <span className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]">
                In corso
              </span>
            </div>
          )}
          {status === "upcoming" && (
            <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-[#C9A84C]/60">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]">
                Coming Soon
              </span>
            </div>
          )}
          {status === "past" && (
            <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/15">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Concluso
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display font-bold text-2xl text-white leading-tight group-hover:text-[#C9A84C] transition-colors duration-300">
          {ev.name}
        </h3>
        {(ev.start_date || ev.end_date) && (
          <p className="mt-3 text-sm text-[#C9A84C]/80 tracking-wide">
            {formatDateRange(ev.start_date, ev.end_date)}
          </p>
        )}
        {ev.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {ev.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 * index }}
    >
      {isPast ? cardInner : <Link to={`/event/${ev.id}`}>{cardInner}</Link>}
    </motion.div>
  );
}
