import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Settings, Calendar } from "lucide-react";
import { useEvento, useGiorni } from "@/hooks/useScheduleData";
import { decodeEventMeta } from "@/lib/eventMeta";
import DayTabs from "@/components/DayTabs";
import ScheduleGrid from "@/components/ScheduleGrid";
import LevelLegend from "@/components/LevelLegend";
import { motion } from "framer-motion";

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: evento, isLoading } = useEvento(eventId);
  const { data: giorni } = useGiorni(eventId);
  const [selectedDay, setSelectedDay] = useState<string>("");

  useEffect(() => {
    if (giorni && giorni.length > 0 && !selectedDay) {
      setSelectedDay(giorni[0].id);
    }
  }, [giorni, selectedDay]);

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!evento) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Evento non trovato
    </div>
  );

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  };

  const meta = decodeEventMeta(evento.description);

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d" }}>
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 260 }}>
        {evento.cover_image_url ? (
          <img src={evento.cover_image_url} alt={evento.name} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center 25%" }} />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1208 0%, #0d0d0d 100%)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,13,13,0.45) 0%, rgba(13,13,13,0.75) 55%, #0d0d0d 100%)" }} />

        <div className="relative z-10 px-6 md:px-12 pt-6 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <ArrowLeft size={14} /> Tutti gli eventi
            </Link>

            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-0.5" style={{ background: "#C9A84C" }} />
              <span className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: "#C9A84C" }}>
                Planning
              </span>
            </div>

            <h1 className="font-display font-black text-white tracking-tight leading-[0.9]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4.5rem)" }}>
              {evento.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {(evento.start_date || evento.end_date) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)" }}>
                  <Calendar size={12} style={{ color: "#C9A84C" }} />
                  <span className="text-xs font-semibold" style={{ color: "#C9A84C" }}>
                    {formatDate(evento.start_date)}{evento.end_date && evento.end_date !== evento.start_date ? ` – ${formatDate(evento.end_date)}` : ""}
                  </span>
                </div>
              )}
              {meta.location && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>📍 {meta.location}</span>
                </div>
              )}
              {meta.styles && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>💃 {meta.styles}</span>
                </div>
              )}
              {meta.website_url && (
                <a href={meta.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>
                  🌐 Sito ufficiale
                </a>
              )}
              {meta.pass_url && (
                <a href={meta.pass_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #e8c870)", color: "#000" }}>
                  🎟 Acquista Pass
                </a>
              )}
            </div>

            {meta.description && (
              <p className="mt-3 text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {meta.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sticky Controls */}
      <div className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: "rgba(13,13,13,0.95)", borderColor: "rgba(201,168,76,0.15)" }}>
        <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-3">
          <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} eventId={eventId} />
          <LevelLegend eventId={eventId} />
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 pb-16 pt-6">
        {selectedDay && <ScheduleGrid selectedDay={selectedDay} eventId={eventId} />}
      </main>

      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{ color: "rgba(255,255,255,0.25)", background: "rgba(17,17,17,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Settings size={13} /> Admin
      </Link>
    </div>
  );
}
