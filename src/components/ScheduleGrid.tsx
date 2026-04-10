import { useSale, useStages, useLivelli } from "@/hooks/useScheduleData";
import { Tables } from "@/integrations/supabase/types";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

function StageBlock({ stage }: { stage: StageWithRelations }) {
  const levelColor = stage.livelli?.color || "#888";
  return (
    <div
      className="rounded-lg p-3 mb-2 border-l-4 bg-card hover:bg-secondary/60 transition-colors"
      style={{ borderLeftColor: levelColor }}
    >
      <div className="text-xs text-muted-foreground font-medium">
        {formatTime(stage.start_time)} – {formatTime(stage.end_time)}
      </div>
      <div className="font-heading font-semibold text-foreground mt-1">{stage.artist}</div>
      <div className="text-sm text-muted-foreground">{stage.title}</div>
      {stage.livelli && (
        <span
          className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: levelColor, color: "#000" }}
        >
          {stage.livelli.name}
        </span>
      )}
    </div>
  );
}

export default function ScheduleGrid({ selectedDay }: { selectedDay: string }) {
  const { data: sale } = useSale();
  const { data: stages } = useStages();

  if (!sale || !stages) return <div className="text-center text-muted-foreground py-12">Loading...</div>;

  const filtered = (stages as StageWithRelations[]).filter((s) => s.giorno_id === selectedDay);

  // Desktop: columns per room; Mobile: stack rooms vertically
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {sale.map((room) => {
        const roomStages = filtered.filter((s) => s.sala_id === room.id);
        return (
          <div key={room.id} className="rounded-xl bg-card border border-border p-4">
            <h3
              className="font-heading font-bold text-lg mb-4 pb-2 border-b"
              style={{ borderBottomColor: room.color, color: room.color }}
            >
              {room.name}
            </h3>
            {roomStages.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">No stages scheduled</p>
            ) : (
              roomStages.map((s) => <StageBlock key={s.id} stage={s} />)
            )}
          </div>
        );
      })}
    </div>
  );
}
