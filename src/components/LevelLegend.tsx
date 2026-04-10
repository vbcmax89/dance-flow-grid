import { useLivelli } from "@/hooks/useScheduleData";

export default function LevelLegend() {
  const { data: livelli } = useLivelli();
  if (!livelli) return null;

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center py-3 px-4 rounded-lg bg-card/50 border border-border">
      <span className="text-muted-foreground text-sm font-medium">Levels:</span>
      {livelli.map((l) => (
        <div key={l.id} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: l.color }}
          />
          <span className="text-sm text-foreground">{l.name}</span>
        </div>
      ))}
    </div>
  );
}
