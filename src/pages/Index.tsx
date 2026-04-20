import { Link } from "react-router-dom";
import { Settings, ChevronDown, Music, Instagram, Facebook, Youtube, Play, Info, ChevronRight, ExternalLink } from "lucide-react";
import { useEventi } from "@/hooks/useScheduleData";
import { motion } from "framer-motion";
import { useMemo, useRef, useState, useEffect } from "react";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden">

      {/* ── NETFLIX-STYLE NAVBAR ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(20,20,20,0.98)"
            : "linear-gradient(180deg, rgba(20,20,20,0.9) 0%, transparent 100%)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span
              className="font-display font-black tracking-tighter text-2xl md:text-3xl"
              style={{ color: "#C9A84C", letterSpacing: "-0.02em" }}
            >
              BeFusion
            </span>
          </Link>

          {/* Nav right */}
          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="https://befusion.it"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-sm text-white/80 hover:text-[#C9A84C] transition-colors font-medium"
            >
              befusion.it
            </a>
            <div className="flex items-center gap-3 text-white/60">
              <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                <Instagram size={18} />
              </a>
              <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative h-screen w-full overflow-hidden">
        {hero?.cover_image_url ? (
          <img
            src={hero.cover_image_url}
            alt={hero.name}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ objectPosition: "center 20%" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1208] via-[#0d0a05] to-[#141414]" />
        )}

        {/* Netflix-style gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141414] to-transparent" />

        {/* Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/8 blur-[120px] pointer-events-none" />

        {/* Hero content — LEFT aligned like Netflix */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-[#C9A84C] mb-5 font-semibold"
          >
            Be Fusion presenta
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display font-black text-white leading-[0.92] tracking-tight"
            style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)" }}
          >
            {hero?.name || "Be Fusion"}
          </motion.h1>

          {hero && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-4 text-[#C9A84C] text-base md:text-lg font-medium tracking-wide"
            >
              {formatDateRange(hero.start_date, hero.end_date)}
            </motion.p>
          )}

          {hero?.description && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-3 text-white/70 text-sm md:text-base leading-relaxed max-w-lg line-clamp-3"
            >
              {hero.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {hero ? (
              <>
                <Link
                  to={`/event/${hero.id}`}
                  className="flex items-center gap-2 px-7 py-3 rounded-md bg-white text-black text-sm font-bold tracking-wide hover:bg-white/85 transition-colors"
                >
                  <Play size={16} fill="currentColor" /> Vedi il Planning
                </Link>
                <button
                  onClick={scrollToEvents}
                  className="flex items-center gap-2 px-7 py-3 rounded-md bg-white/20 backdrop-blur-sm text-white text-sm font-semibold tracking-wide hover:bg-white/30 transition-colors border border-white/10"
                >
                  <Info size={16} /> Tutti gli eventi
                </button>
              </>
            ) : (
              <button
                onClick={scrollToEvents}
                className="flex items-center gap-2 px-7 py-3 rounded-md bg-[#C9A84C] text-black text-sm font-bold tracking-wide hover:bg-[#b8944a] transition-colors"
              >
                <Play size={16} fill="currentColor" /> Vedi gli eventi
              </button>
            )}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <button
          onClick={scrollToEvents}
          aria-label="Scorri agli eventi"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#C9A84C]/70 animate-bounce"
        >
          <ChevronDown size={28} strokeWidth={1.5} />
        </button>
      </section>

      {/* ── EVENTS ROW ── */}
      <section ref={eventsRef} className="pt-2 pb-16">
        {current.length > 0 && (
          <NetflixRow title="Prossimi eventi" items={current} />
        )}
        {past.length > 0 && (
          <NetflixRow title="Edizioni precedenti" items={past} muted />
        )}
        {!isLoading && (eventi?.length ?? 0) === 0 && (
          <div className="text-center py-24">
            <Music className="mx-auto text-[#C9A84C]/30 mb-4" size={48} />
            <p className="text-white/40">Nessun evento ancora.</p>
          </div>
        )}
        {isLoading && (
          <div className="px-8 md:px-16 flex gap-4 overflow-hidden mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-72 h-44 rounded-lg bg-[#222] animate-pulse" />
            ))}
          </div>
        )}
      </section>

      {/* ── ORGANIZERS SECTION ── */}
      <section className="py-20 px-6 md:px-16 bg-[#0e0e0e]">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display font-bold text-white text-3xl md:text-4xl mb-2"
          >
            Gli organizzatori
          </motion.h2>
          <div className="w-12 h-0.5 bg-[#C9A84C] mb-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Befusion.it */}
            <motion.a
              href="https://befusion.it"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative rounded-xl overflow-hidden border border-[#C9A84C]/20 bg-[#1a1a1a] p-8 hover:border-[#C9A84C]/60 hover:bg-[#1f1f1f] transition-all duration-300 cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#C9A84C] rounded-l-xl" />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C]/70 mb-2 font-semibold">Organizzatore</div>
                  <h3 className="font-display font-bold text-2xl text-white group-hover:text-[#C9A84C] transition-colors">
                    BeFusion
                  </h3>
                  <p className="text-[#C9A84C]/80 text-sm font-mono mt-0.5">befusion.it</p>
                </div>
                <ExternalLink size={18} className="text-white/30 group-hover:text-[#C9A84C] transition-colors mt-1 shrink-0" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                BeFusion è il brand che porta la bachata fusion in Italia con eventi esclusivi, workshop internazionali e festival multigenere. Una community appassionata, una proposta artistica unica.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#C9A84C]/70 group-hover:text-[#C9A84C] transition-colors">
                Visita il sito <ChevronRight size={14} />
              </div>
            </motion.a>

            {/* BachataFusion.it */}
            <motion.a
              href="https://bachatafusion.it"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative rounded-xl overflow-hidden border border-[#C9A84C]/20 bg-[#1a1a1a] p-8 hover:border-[#C9A84C]/60 hover:bg-[#1f1f1f] transition-all duration-300 cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#C9A84C]/60 rounded-l-xl" />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C]/70 mb-2 font-semibold">Piattaforma</div>
                  <h3 className="font-display font-bold text-2xl text-white group-hover:text-[#C9A84C] transition-colors">
                    BachataFusion
                  </h3>
                  <p className="text-[#C9A84C]/80 text-sm font-mono mt-0.5">bachatafusion.it</p>
                </div>
                <ExternalLink size={18} className="text-white/30 group-hover:text-[#C9A84C] transition-colors mt-1 shrink-0" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Il portale di riferimento per la comunità italiana della bachata fusion: calendario eventi, guide ai livelli, risorse per ballerini e insegnanti di tutta la penisola.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#C9A84C]/70 group-hover:text-[#C9A84C] transition-colors">
                Visita il sito <ChevronRight size={14} />
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0a0a] border-t border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <span className="font-display font-black text-2xl text-[#C9A84C] tracking-tight">BeFusion</span>
              <p className="text-xs text-white/40 max-w-xs text-center md:text-left leading-relaxed">
                La bachata fusion in Italia. Passione, arte e movimento.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex items-center gap-5 text-white/50">
                <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" aria-label="Youtube" className="hover:text-[#C9A84C] transition-colors">
                  <Youtube size={20} />
                </a>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <a href="https://befusion.it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">befusion.it</a>
                <span>·</span>
                <a href="https://bachatafusion.it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">bachatafusion.it</a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/8 text-center text-[11px] text-white/25">
            © {new Date().getFullYear()} BeFusion · Tutti i diritti riservati
          </div>
        </div>
      </footer>

      {/* Admin link */}
      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/30 bg-[#111]/80 backdrop-blur-sm border border-white/10 hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-all"
      >
        <Settings size={13} />
        Admin
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Netflix-style horizontal row                   */
/* ─────────────────────────────────────────────── */
function NetflixRow({ title, items, muted = false }: { title: string; items: any[]; muted?: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-10 px-0">
      <h2 className="font-display font-bold text-white text-lg md:text-xl mb-4 px-8 md:px-16">
        {title}
      </h2>
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-4 px-8 md:px-16"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((ev, i) => (
          <NetflixCard key={ev.id} ev={ev} index={i} muted={muted} />
        ))}
      </div>
    </div>
  );
}

function NetflixCard({ ev, index, muted }: { ev: any; index: number; muted: boolean }) {
  const status: EventStatus = ev._status;
  const isPast = status === "past";

  const inner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={isPast ? {} : { scale: 1.05, zIndex: 10 }}
      className={[
        "relative shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] transition-all duration-300",
        "w-64 md:w-72",
        isPast ? "opacity-50 grayscale-[0.7]" : "cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/60",
      ].join(" ")}
      style={{ aspectRatio: "16/9" }}
    >
      {ev.cover_image_url ? (
        <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
          <Music className="text-[#C9A84C]/20" size={36} />
        </div>
      )}

      {/* Gradient bottom overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Status badge */}
      <div className="absolute top-2 left-2">
        {status === "active" && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[9px] font-bold tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            In corso
          </span>
        )}
        {status === "upcoming" && (
          <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[9px] font-bold tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30">
            Coming Soon
          </span>
        )}
      </div>

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="font-display font-bold text-white text-sm leading-tight truncate">{ev.name}</div>
        {(ev.start_date || ev.end_date) && (
          <div className="text-[#C9A84C]/80 text-[10px] mt-0.5 font-medium truncate">
            {formatDateRange(ev.start_date, ev.end_date)}
          </div>
        )}
      </div>
    </motion.div>
  );

  return isPast ? inner : <Link to={`/event/${ev.id}`}>{inner}</Link>;
}
