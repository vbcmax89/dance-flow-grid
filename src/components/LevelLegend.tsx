import { useLivelli } from "@/hooks/useScheduleData";

export default function LevelLegend({ eventId }: { eventId?: string }) {
  const { data: livelli } = useLivelli(eventId);
  if (!livelli || livelli.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center">
      {livelli.map((l) => (
        <div key={l.id} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block ring-2 ring-offset-1 ring-offset-background"
            style={{ backgroundColor: l.color, ringColor: l.color }}
          />
          <span className="text-xs font-medium text-muted-foreground">{l.name}</span>
        </div>
      ))}
    </div>
  );
}
