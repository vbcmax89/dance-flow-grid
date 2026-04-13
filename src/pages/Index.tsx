import { Link } from "react-router-dom";
import { Settings, Calendar } from "lucide-react";
import { useEventi } from "@/hooks/useScheduleData";

export default function Index() {
  const { data: eventi, isLoading } = useEventi();

  return (
    <div className="min-h-screen bg-background">
      <header className="text-center py-10 px-4">
        <h1 className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dance Events
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Choose an event to view the schedule</p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {isLoading && <p className="text-center text-muted-foreground">Loading...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventi?.map((ev) => (
            <Link
              key={ev.id}
              to={`/event/${ev.id}`}
              className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-all"
            >
              <div className="relative h-40 overflow-hidden">
                {ev.cover_image_url ? (
                  <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="p-4">
                <h2 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">{ev.name}</h2>
                {ev.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>}
                {(ev.start_date || ev.end_date) && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {ev.start_date}{ev.end_date ? ` – ${ev.end_date}` : ""}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        {!isLoading && eventi?.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No events yet. Add one from the admin panel.</p>
        )}
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
