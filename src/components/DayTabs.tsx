import { useGiorni } from "@/hooks/useScheduleData";

interface DayTabsProps {
  selectedDay: string;
  onSelectDay: (id: string) => void;
  eventId?: string;
}

export default function DayTabs({ selectedDay, onSelectDay, eventId }: DayTabsProps) {
  const { data: giorni } = useGiorni(eventId);
  if (!giorni) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1 justify-start md:justify-center">
      {giorni.map((g) => {
        const active = selectedDay === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onSelectDay(g.id)}
            className={`shrink-0 px-5 py-2 rounded-full font-heading font-bold text-xs uppercase tracking-wider transition-all duration-300 border ${
              active
                ? "bg-gold text-[hsl(var(--gold-foreground))] border-gold shadow-[var(--shadow-gold)]"
                : "bg-transparent text-gold border-gold/40 hover:border-gold hover:bg-gold/10"
            }`}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}
