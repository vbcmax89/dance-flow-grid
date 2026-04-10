import { useGiorni } from "@/hooks/useScheduleData";

interface DayTabsProps {
  selectedDay: string;
  onSelectDay: (id: string) => void;
}

export default function DayTabs({ selectedDay, onSelectDay }: DayTabsProps) {
  const { data: giorni } = useGiorni();
  if (!giorni) return null;

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {giorni.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelectDay(g.id)}
          className={`px-5 py-2 rounded-full font-heading font-semibold text-sm transition-all ${
            selectedDay === g.id
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
