import { useLivelli } from "@/hooks/useScheduleData";

export default function LevelLegend({ eventId }: { eventId?: string }) {
  const { data: livelli } = useLivelli(eventId);
  if (!livelli || livelli.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {livelli.map((l) => (
        <div
          key={l.id}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
          style={{
            background: `${l.color}20`,
            color: l.color,
            border: `1px solid ${l.color}55`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}` }}
          />
          {l.name}
        </div>
      ))}
    </div>
  );
}
