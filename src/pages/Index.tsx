import { Link } from "react-router-dom";
import { Settings, Calendar, ArrowRight, Music } from "lucide-react";
import { useEventi } from "@/hooks/useScheduleData";
import { motion } from "framer-motion";

export default function Index() {
  const { data: eventi, isLoading } = useEventi();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="relative z-10 text-center py-20 md:py-28 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Music className="text-primary" size={20} />
            <span className="text-sm font-medium tracking-widest uppercase text-primary">
              Dance Events
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-5xl md:text-7xl font-black tracking-tight"
          >
            <span className="text-gradient-primary">Scopri</span>{" "}
            <span className="text-foreground">gli Eventi</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground mt-4 text-lg md:text-xl max-w-md mx-auto"
          >
            Scegli il tuo evento e consulta il programma completo
          </motion.p>
        </div>
      </header>

      {/* Events Grid */}
      <main className="max-w-5xl mx-auto px-4 pb-20 -mt-4">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventi?.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 * i }}
            >
              <Link
                to={`/event/${ev.id}`}
                className="group block rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_40px_hsl(25_95%_53%/0.12)]"
              >
                <div className="relative h-48 overflow-hidden">
                  {ev.cover_image_url ? (
                    <img
                      src={ev.cover_image_url}
                      alt={ev.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <Music className="text-primary/30" size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
                <div className="p-5">
                  <h2 className="font-heading font-bold text-xl text-foreground group-hover:text-primary transition-colors duration-200">
                    {ev.name}
                  </h2>
                  {ev.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    {(ev.start_date || ev.end_date) ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} className="text-primary/70" />
                        {ev.start_date}{ev.end_date ? ` – ${ev.end_date}` : ""}
                      </div>
                    ) : <div />}
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Vedi Programma <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {!isLoading && eventi?.length === 0 && (
          <div className="text-center py-20">
            <Music className="mx-auto text-muted-foreground/30 mb-4" size={48} />
            <p className="text-muted-foreground">Nessun evento ancora. Aggiungine uno dal pannello admin.</p>
          </div>
        )}
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
