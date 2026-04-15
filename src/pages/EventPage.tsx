import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { useEvento, useGiorni } from "@/hooks/useScheduleData";
import DayTabs from "@/components/DayTabs";
import ScheduleGrid from "@/components/ScheduleGrid";
import LevelLegend from "@/components/LevelLegend";

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: evento, isLoading } = useEvento(eventId);
  const { data: giorni } = useGiorni();
  const [selectedDay, setSelectedDay] = useState<string>("");

  useEffect(() => {
    if (giorni && giorni.length > 0 && !selectedDay) {
      setSelectedDay(giorni[0].id);
    }
  }, [giorni, selectedDay]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!evento) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Event not found</div>;

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        {evento.cover_image_url ? (
          <img src={evento.cover_image_url} alt={evento.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft size={14} /> All Events
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground">{evento.name}</h1>
          {(evento.start_date || evento.end_date) && (
            <p className="text-muted-foreground mt-1 text-base md:text-lg">
              {formatDate(evento.start_date)}{evento.end_date ? ` – ${formatDate(evento.end_date)}` : ""}
            </p>
          )}
          {evento.description && <p className="text-muted-foreground/80 mt-1 text-sm max-w-2xl">{evento.description}</p>}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16 pt-6 space-y-6">
        <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        <LevelLegend />
        {selectedDay && <ScheduleGrid selectedDay={selectedDay} eventId={eventId} />}
      </main>

      <Link
        to="/admin"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/70 bg-card/60 backdrop-blur-sm border border-border/40 hover:text-foreground hover:bg-card/80 transition-all"
      >
        <Settings size={14} />
        Admin
      </Link>
    </div>
  );
}
