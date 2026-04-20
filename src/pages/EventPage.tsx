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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        {evento.cover_image_url ? (
          <img src={evento.cover_image_url} alt={evento.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Tutti gli Eventi
            </Link>
            <h1 className="font-heading text-4xl md:text-6xl font-black text-foreground tracking-tight">
              {evento.name}
            </h1>
            {(evento.start_date || evento.end_date) && (
              <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                <Calendar size={14} className="text-primary" />
                <span className="text-sm md:text-base">
                  {formatDate(evento.start_date)}{evento.end_date ? ` – ${formatDate(evento.end_date)}` : ""}
                </span>
              </div>
            )}
            {decodeEventMeta(evento.description).description && (
              <p className="text-muted-foreground/80 mt-2 text-sm max-w-2xl leading-relaxed">
                {decodeEventMeta(evento.description).description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sticky Controls */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} eventId={eventId} />
          <LevelLegend eventId={eventId} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16 pt-6">
        {selectedDay && <ScheduleGrid selectedDay={selectedDay} eventId={eventId} />}
      </main>

      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/60 bg-card/80 backdrop-blur-sm border border-border/40 hover:text-primary hover:border-primary/30 transition-all"
      >
        <Settings size={14} />
        Admin
      </Link>
    </div>
  );
}
