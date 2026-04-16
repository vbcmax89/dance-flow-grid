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
    <div className="flex gap-2 flex-wrap justify-center">
      {giorni.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelectDay(g.id)}
          className={`relative px-5 py-2 rounded-full font-heading font-bold text-sm transition-all duration-200 ${
            selectedDay === g.id
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(25_95%_53%/0.3)]"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
