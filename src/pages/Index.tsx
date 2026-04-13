import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import DayTabs from "@/components/DayTabs";
import ScheduleGrid from "@/components/ScheduleGrid";
import LevelLegend from "@/components/LevelLegend";
import { useGiorni } from "@/hooks/useScheduleData";

export default function Index() {
  const { data: giorni } = useGiorni();
  const [selectedDay, setSelectedDay] = useState<string>("");

  useEffect(() => {
    if (giorni && giorni.length > 0 && !selectedDay) {
      setSelectedDay(giorni[0].id);
    }
  }, [giorni, selectedDay]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="text-center py-10 px-4">
        <h1 className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          The Heels Event 2026
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Dance Festival Schedule</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        <LevelLegend />
        {selectedDay && <ScheduleGrid selectedDay={selectedDay} />}
      </main>

      <Link
        to="/admin"
        className="fixed bottom-4 right-4 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        Admin
      </Link>
    </div>
  );
}
