import { Link } from "react-router-dom";
import {
  Settings, Music, Instagram, Facebook, Youtube,
  Play, ChevronRight, ExternalLink, ChevronLeft,
  CalendarDays, MapPin, Layers, Globe, Ticket,
} from "lucide-react";
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

function eventDurationDays(start?: string | null, end?: string | null): number {
  if (!start || !end) return 1;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

function useCountdown(targetDate?: string | null) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, started: false });
  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0, started: true }); return; }
      setT({
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
  return t;
}

export default function Index() {
  const { data: eventi, isLoading } = useEventi();
  const eventsRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const heroEvents = useMemo(() => {
    const list = (eventi || []).map((e) => ({ ...e, _status: getStatus(e.start_date, e.end_date) }));
    return list.filter((e) => e._status !== "past");
  }, [eventi]);

  useEffect(() => {
    if (paused || heroEvents.length <= 1) return;
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroEvents.length), 6000);
    return () => clearInterval(id);
  }, [paused, heroEvents.length]);

  const hero = heroEvents[heroIndex] ?? heroEvents[0];
  const prevHero = useCallback(() => { setHeroIndex((i) => (i - 1 + heroEvents.length) % heroEvents.length); setPaused(true); }, [heroEvents.length]);
  const nextHero = useCallback(() => { setHeroIndex((i) => (i + 1) % heroEvents.length); setPaused(true); }, [heroEvents.length]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
        style={{ background: scrolled ? "rgba(13,13,13,0.97)" : "transparent" }}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-black text-2xl tracking-tight" style={{ color: "#C9A84C" }}>
            BeFusion
          </Link>
          <div className="flex items-center gap-5">
            <a href="https://befusion.it" target="_blank" rel="noopener noreferrer"
              className="hidden sm:block text-sm text-white/60 hover:text-[#C9A84C] transition-colors font-medium">
              befusion.it
            </a>
            <div className="flex items-center gap-3 text-white/40">
              <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Instagram size={17} /></a>
              <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Facebook size={17} /></a>
            </div>
          </div>
        </div>
      </header>

      {/* ── SPLIT HERO ── */}
      <section
        className="relative min-h-screen w-full flex flex-col"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Dark background */}
        <div className="absolute inset-0 bg-[#0d0d0d]" />
        {/* Subtle gold glow top-left */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)", transform: "translate(-30%, -30%)" }} />

        <div className="relative z-10 flex-1 flex flex-col md:flex-row items-stretch pt-16">

          {/* LEFT — text panel */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 md:py-20 order-2 md:order-1">

            <AnimatePresence mode="wait">
              <motion.div
                key={hero?.id ?? "empty"}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5 }}
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-0.5 bg-[#C9A84C]" />
                  <span className="text-[10px] tracking-[0.45em] uppercase text-[#C9A84C] font-bold">
                    Be Fusion presenta
                  </span>
                </div>

                {/* Event name — massive */}
                <h1
                  className="font-display font-black text-white leading-[0.88] tracking-tight"
                  style={{
                    fontSize: "clamp(3rem, 6.5vw, 5.5rem)",
                    textShadow: "0 4px 40px rgba(201,168,76,0.15)",
                  }}
                >
                  {hero?.name ?? "Be Fusion"}
                </h1>

                {/* Date */}
                {(hero?.start_date || hero?.end_date) && (
                  <p className="mt-4 text-[#C9A84C] text-base font-semibold tracking-wide">
                    {formatDateRange(hero.start_date, hero.end_date)}
                  </p>
                )}

                {/* Key info list */}
                {hero && (
                  <ul className="mt-6 space-y-2.5">
                    <InfoRow icon={<CalendarDays size={14} />}
                      text={`${eventDurationDays(hero.start_date, hero.end_date)} ${eventDurationDays(hero.start_date, hero.end_date) === 1 ? "giorno" : "giorni"} di festival`} />
                    {hero.styles && <InfoRow icon={<Layers size={14} />} text={hero.styles} />}
                    {hero.location && <InfoRow icon={<MapPin size={14} />} text={hero.location} />}
                    {hero._status === "active" && (
                      <InfoRow icon={<span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse inline-block" />} text="In corso ora" gold />
                    )}
                    {/* Website + Pass links */}
                    {(hero.website_url || hero.pass_url) && (
                      <li className="flex items-center gap-3 pt-1">
                        {hero.website_url && (
                          <a href={hero.website_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-[#C9A84C] transition-colors border border-white/15 hover:border-[#C9A84C]/50 rounded-full px-3 py-1">
                            <Globe size={11} /> Sito ufficiale
                          </a>
                        )}
                        {hero.pass_url && (
                          <a href={hero.pass_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity rounded-full px-3 py-1"
                            style={{ background: "linear-gradient(135deg, #C9A84C, #e8c870)" }}>
                            <Ticket size={11} /> Acquista Pass
                          </a>
                        )}
                      </li>
                    )}
                  </ul>
                )}

                {/* Countdown */}
                {hero?._status === "upcoming" && hero.start_date && (
                  <div className="mt-7">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3 font-semibold">Inizia tra</p>
                    <CountdownRow targetDate={hero.start_date} />
                  </div>
                )}

                {/* CTAs */}
                {hero && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      to={`/event/${hero.id}`}
                      className="group flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm tracking-wide text-black transition-all duration-300 hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c870 50%, #C9A84C 100%)" }}
                    >
                      <Play size={14} fill="currentColor" /> Scopri il Planning
                    </Link>
                    <button
                      onClick={() => eventsRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide text-white/80 border border-white/20 hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all duration-300"
                    >
                      Tutti gli eventi <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Dots navigation */}
            {heroEvents.length > 1 && (
              <div className="mt-10 flex items-center gap-2">
                {heroEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setHeroIndex(i); setPaused(true); }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === heroIndex ? 28 : 8,
                      height: 4,
                      background: i === heroIndex ? "#C9A84C" : "rgba(255,255,255,0.25)",
                    }}
                  />
                ))}
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={prevHero} className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all">
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={nextHero} className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — image panel */}
          <div className="w-full md:w-[46%] lg:w-[42%] relative flex items-center justify-center order-1 md:order-2 min-h-[40vh] md:min-h-0">
            {/* Gold accent line */}
            <div className="hidden md:block absolute left-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-[#C9A84C]/40 to-transparent" />

            <AnimatePresence mode="wait">
              <motion.div
                key={hero?.id ?? "empty-img"}
                initial={{ opacity: 0, scale: 0.97, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.97, x: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full relative"
              >
                {hero?.cover_image_url ? (
                  <>
                    <img
                      src={hero.cover_image_url}
                      alt={hero.name}
                      className="w-full h-full object-cover"
                      style={{ minHeight: "40vh", maxHeight: "100vh" }}
                    />
                    {/* Fade left edge into dark bg */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0d0d0d] to-transparent" />
                    {/* Fade bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d0d0d] to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#111]" style={{ minHeight: "40vh" }}>
                    <Music className="text-[#C9A84C]/15" size={80} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── ORGANIZER STRIP ── */}
      <div className="bg-[#111] border-y border-white/6">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 py-4 flex flex-wrap items-center justify-between gap-4 text-sm text-white/40">
          <div className="flex items-center gap-6">
            <a href="https://befusion.it" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#C9A84C] transition-colors font-medium">
              <span className="text-[#C9A84C]/60 font-bold">BeFusion</span>
              <span className="text-xs">befusion.it</span>
              <ExternalLink size={11} />
            </a>
            <span className="hidden sm:block text-white/20">·</span>
            <a href="https://bachatafusion.it" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 hover:text-[#C9A84C] transition-colors">
              <span className="text-xs">bachatafusion.it</span>
              <ExternalLink size={11} />
            </a>
          </div>
          <div className="flex items-center gap-4 text-white/30">
            <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Instagram size={16} /></a>
            <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Facebook size={16} /></a>
            <a href="#" className="hover:text-[#C9A84C] transition-colors"><Youtube size={16} /></a>
          </div>
        </div>
      </div>

      {/* ── EVENTS ROW ── */}
      <section ref={eventsRef} className="pt-12 pb-20">
        {heroEvents.length > 0 ? (
          <NetflixRow title="Prossimi eventi" items={heroEvents} />
        ) : !isLoading ? (
          <div className="text-center py-24 px-8">
            <Music className="mx-auto text-[#C9A84C]/20 mb-4" size={48} />
            <p className="text-white/30">Nessun evento in programma.</p>
          </div>
        ) : (
          <div className="px-8 md:px-16 flex gap-4 overflow-hidden mt-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="shrink-0 w-72 h-44 rounded-lg bg-[#1a1a1a] animate-pulse" />)}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0a0a] border-t border-white/6">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="font-display font-black text-2xl text-[#C9A84C] tracking-tight">BeFusion</span>
              <p className="text-xs text-white/35 max-w-xs text-center md:text-left leading-relaxed">
                La bachata fusion in Italia. Passione, arte e movimento.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-5 text-white/40">
                <a href="https://www.instagram.com/befusion_it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Instagram size={19} /></a>
                <a href="https://www.facebook.com/befusionitaly" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors"><Facebook size={19} /></a>
                <a href="#" className="hover:text-[#C9A84C] transition-colors"><Youtube size={19} /></a>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/35">
                <a href="https://befusion.it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">befusion.it</a>
                <span>·</span>
                <a href="https://bachatafusion.it" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">bachatafusion.it</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-5 border-t border-white/6 text-center text-[11px] text-white/20">
            © {new Date().getFullYear()} BeFusion · Tutti i diritti riservati
          </div>
        </div>
      </footer>

      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/20 bg-[#111]/80 backdrop-blur-sm border border-white/8 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all"
      >
        <Settings size={13} /> Admin
      </Link>
    </div>
  );
}

/* ── Info row with checkmark-style icon ── */
function InfoRow({ icon, text, gold = false }: { icon: React.ReactNode; text: string; gold?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${gold ? "bg-[#C9A84C]/20 text-[#C9A84C]" : "bg-white/8 text-[#C9A84C]/70"}`}>
        {icon}
      </span>
      <span className={`text-sm font-medium ${gold ? "text-[#C9A84C]" : "text-white/65"}`}>{text}</span>
    </li>
  );
}

/* ── Countdown ── */
function CountdownRow({ targetDate }: { targetDate: string }) {
  const { days, hours, minutes, seconds, started } = useCountdown(targetDate);
  if (started) return null;
  return (
    <div className="flex items-center gap-2">
      {days > 0 && <CountUnit value={days} label="giorni" />}
      <CountUnit value={hours} label="ore" />
      <CountUnit value={minutes} label="min" />
      {days === 0 && <CountUnit value={seconds} label="sec" />}
    </div>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3.5rem] bg-white/6 border border-white/10 rounded-lg px-3 py-2">
      <span className="font-mono font-black text-2xl text-white leading-none tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="text-[9px] text-white/35 uppercase tracking-widest mt-1 font-semibold">{label}</span>
    </div>
  );
}

/* ── Netflix row ── */
function NetflixRow({ title, items }: { title: string; items: any[] }) {
  return (
    <div>
      <h2 className="font-display font-bold text-white text-xl mb-5 px-8 md:px-16">{title}</h2>
      <div className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-8 md:px-16" style={{ scrollbarWidth: "none" }}>
        {items.map((ev, i) => <NetflixCard key={ev.id} ev={ev} index={i} />)}
      </div>
    </div>
  );
}

function NetflixCard({ ev, index }: { ev: any; index: number }) {
  const status: EventStatus = ev._status;
  const countdown = useCountdown(status === "upcoming" ? ev.start_date : null);

  return (
    <Link to={`/event/${ev.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ scale: 1.04, y: -4 }}
        className="relative shrink-0 rounded-xl overflow-hidden bg-[#1a1a1a] cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/70 border border-white/5 hover:border-[#C9A84C]/30 transition-all duration-300"
        style={{ width: "clamp(220px, 18vw, 300px)", aspectRatio: "16/9" }}
      >
        {ev.cover_image_url ? (
          <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
            <Music className="text-[#C9A84C]/15" size={36} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

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
            <div className="text-[#C9A84C]/70 text-[10px] mt-0.5 font-medium truncate">
              {formatDateRange(ev.start_date, ev.end_date)}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
