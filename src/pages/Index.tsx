import { Link } from "react-router-dom";
import { Settings, Music, Instagram, Facebook, Youtube, Play, Info, ChevronRight, ExternalLink, ChevronLeft } from "lucide-react";
import { useEventi } from "@/hooks/useScheduleData";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";

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

function useCountdown(targetDate?: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, started: false });

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, started: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        started: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function Index() {
  const { data: eventi, isLoading } = useEventi();
  const eventsRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { heroEvents, allCurrent } = useMemo(() => {
    const list = eventi || [];
    const withStatus = list.map((e) => ({ ...e, _status: getStatus(e.start_date, e.end_date) }));
    const current = withStatus.filter((e) => e._status !== "past");
    return { heroEvents: current, allCurrent: current };
  }, [eventi]);

  // Auto-advance hero
  useEffect(() => {
    if (paused || heroEvents.length <= 1) return;
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroEvents.length), 5000);
    return () => clearInterval(id);
  }, [paused, heroEvents.length]);

  const hero = heroEvents[heroIndex] ?? heroEvents[0];

  const prevHero = useCallback(() => {
    setHeroIndex((i) => (i - 1 + heroEvents.length) % heroEvents.length);
    setPaused(true);
  }, [heroEvents.length]);

  const nextHero = useCallback(() => {
    setHeroIndex((i) => (i + 1) % heroEvents.length);
    setPaused(true);
  }, [heroEvents.length]);

  return (
    <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(20,20,20,0.97)"
            : "linear-gradient(180deg, rgba(20,20,20,0.85) 0%, transparent 100%)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-black text-2xl md:text-3xl tracking-tight" style={{ color: "#C9A84C" }}>
            BeFusion
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <a href="https://befusion.it" target="_blank" rel="noopener noreferrer"
              className="hidden sm:block text-sm text-white/70 hover:text-[#C9A84C] transition-colors font-medium">
              befusion.it
            </a>
            <div className="flex items-center gap-3 text-white/50">
              <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Instagram size={18} /></a>
              <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Facebook size={18} /></a>
            </div>
          </div>
        </div>
      </header>

      {/* ── ROTATING HERO ── */}
      <section
        className="relative h-screen w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background slides */}
        <AnimatePresence mode="sync">
          <motion.div
            key={hero?.id ?? "empty"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0"
          >
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
          </motion.div>
        </AnimatePresence>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-[1]" />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[#141414] to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/50 via-transparent to-transparent z-[1]" />

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hero?.id ?? "empty-content"}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-3xl"
          >
            {hero ? (
              <>
                <span className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-[#C9A84C] mb-5 font-semibold">
                  Be Fusion presenta
                </span>

                <h1
                  className="font-display font-black text-white leading-[0.92] tracking-tight"
                  style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
                >
                  {hero.name}
                </h1>

                {(hero.start_date || hero.end_date) && (
                  <p className="mt-4 text-[#C9A84C] text-base md:text-lg font-medium tracking-wide">
                    {formatDateRange(hero.start_date, hero.end_date)}
                  </p>
                )}

                {/* Countdown */}
                {hero._status === "upcoming" && hero.start_date && (
                  <CountdownBadge targetDate={hero.start_date} />
                )}
                {hero._status === "active" && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
                    <span className="text-[#C9A84C] text-sm font-bold tracking-widest uppercase">In corso ora</span>
                  </div>
                )}

                {hero.description && (
                  <p className="mt-4 text-white/65 text-sm md:text-base leading-relaxed max-w-lg line-clamp-2">
                    {hero.description}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={`/event/${hero.id}`}
                    className="flex items-center gap-2 px-7 py-3 rounded-md bg-white text-black text-sm font-bold tracking-wide hover:bg-white/85 transition-colors"
                  >
                    <Play size={15} fill="currentColor" /> Vedi il Planning
                  </Link>
                  <button
                    onClick={() => eventsRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2 px-7 py-3 rounded-md bg-white/20 backdrop-blur-sm text-white text-sm font-semibold tracking-wide hover:bg-white/28 transition-colors border border-white/10"
                  >
                    <Info size={15} /> Tutti gli eventi
                  </button>
                </div>
              </>
            ) : !isLoading ? (
              <p className="text-white/40">Nessun evento in programma.</p>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {heroEvents.length > 1 && (
          <>
            <button
              onClick={prevHero}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextHero}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {heroEvents.length > 1 && (
          <div className="absolute bottom-12 left-8 md:left-16 z-20 flex items-center gap-2">
            {heroEvents.map((_, i) => (
              <button
                key={i}
                onClick={() => { setHeroIndex(i); setPaused(true); }}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === heroIndex ? 24 : 8,
                  height: 4,
                  background: i === heroIndex ? "#C9A84C" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── EVENTS ROWS ── */}
      <section ref={eventsRef} className="pt-4 pb-16">
        {allCurrent.length > 0 ? (
          <NetflixRow title="Prossimi eventi" items={allCurrent} />
        ) : !isLoading ? (
          <div className="text-center py-24 px-8">
            <Music className="mx-auto text-[#C9A84C]/30 mb-4" size={48} />
            <p className="text-white/40">Nessun evento in programma.</p>
          </div>
        ) : (
          <div className="px-8 md:px-16 flex gap-4 overflow-hidden mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-72 h-44 rounded-lg bg-[#222] animate-pulse" />
            ))}
          </div>
        )}
      </section>

      {/* ── ORGANIZERS ── */}
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
            <OrganizerCard
              label="Organizzatore"
              name="BeFusion"
              domain="befusion.it"
              href="https://befusion.it"
              description="BeFusion è il brand che porta la bachata fusion in Italia con eventi esclusivi, workshop internazionali e festival multigenere."
              delay={0}
            />
            <OrganizerCard
              label="Piattaforma"
              name="BachataFusion"
              domain="bachatafusion.it"
              href="https://bachatafusion.it"
              description="Il portale di riferimento per la comunità italiana della bachata fusion: calendario eventi, guide ai livelli, risorse per ballerini e insegnanti."
              delay={0.1}
            />
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
                <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Instagram size={20} /></a>
                <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Facebook size={20} /></a>
                <a href="#" className="hover:text-[#C9A84C] transition-colors"><Youtube size={20} /></a>
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

      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/25 bg-[#111]/80 backdrop-blur-sm border border-white/8 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all"
      >
        <Settings size={13} /> Admin
      </Link>
    </div>
  );
}

/* ── Countdown badge ── */
function CountdownBadge({ targetDate }: { targetDate: string }) {
  const { days, hours, minutes, seconds, started } = useCountdown(targetDate);
  if (started) return null;
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Inizia tra</span>
      <div className="flex items-center gap-1.5">
        {days > 0 && <CountUnit value={days} label="g" />}
        <CountUnit value={hours} label="h" />
        <CountUnit value={minutes} label="m" />
        {days === 0 && <CountUnit value={seconds} label="s" />}
      </div>
    </div>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded px-2 py-1 min-w-[2.8rem] justify-center">
      <span className="font-mono font-bold text-white text-lg leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-white/50 text-[10px] font-semibold">{label}</span>
    </div>
  );
}

/* ── Netflix row ── */
function NetflixRow({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="mt-10">
      <h2 className="font-display font-bold text-white text-lg md:text-xl mb-4 px-8 md:px-16">{title}</h2>
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth pb-4 px-8 md:px-16"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((ev, i) => <NetflixCard key={ev.id} ev={ev} index={i} />)}
      </div>
    </div>
  );
}

function NetflixCard({ ev, index }: { ev: any; index: number }) {
  const status: EventStatus = ev._status;
  const countdown = useCountdown(status === "upcoming" ? ev.start_date : null);

  const inner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="relative shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/60 transition-shadow duration-300"
      style={{ width: "clamp(220px, 18vw, 300px)", aspectRatio: "16/9" }}
    >
      {ev.cover_image_url ? (
        <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
          <Music className="text-[#C9A84C]/20" size={36} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

      {/* Status badge */}
      <div className="absolute top-2 left-2">
        {status === "active" && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" /> In corso
          </span>
        )}
        {status === "upcoming" && !countdown.started && countdown.days <= 30 && (
          <span className="px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30">
            {countdown.days > 0 ? `tra ${countdown.days}g` : `tra ${countdown.hours}h`}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="font-display font-bold text-white text-sm leading-tight truncate">{ev.name}</div>
        {(ev.start_date || ev.end_date) && (
          <div className="text-[#C9A84C]/75 text-[10px] mt-0.5 font-medium truncate">
            {formatDateRange(ev.start_date, ev.end_date)}
          </div>
        )}
      </div>
    </motion.div>
  );

  return <Link to={`/event/${ev.id}`}>{inner}</Link>;
}

/* ── Organizer card ── */
function OrganizerCard({ label, name, domain, href, description, delay }: {
  label: string; name: string; domain: string; href: string; description: string; delay: number;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group relative rounded-xl border border-[#C9A84C]/20 bg-[#1a1a1a] p-8 hover:border-[#C9A84C]/60 hover:bg-[#1f1f1f] transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-[#C9A84C] rounded-l-xl" />
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C]/60 mb-2 font-semibold">{label}</div>
          <h3 className="font-display font-bold text-2xl text-white group-hover:text-[#C9A84C] transition-colors">{name}</h3>
          <p className="text-[#C9A84C]/70 text-sm font-mono mt-0.5">{domain}</p>
        </div>
        <ExternalLink size={17} className="text-white/25 group-hover:text-[#C9A84C] transition-colors mt-1 shrink-0" />
      </div>
      <p className="text-white/55 text-sm leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#C9A84C]/60 group-hover:text-[#C9A84C] transition-colors">
        Visita il sito <ChevronRight size={13} />
      </div>
    </motion.a>
  );
}
