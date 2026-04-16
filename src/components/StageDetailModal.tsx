import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, MapPin, User } from "lucide-react";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default function StageDetailModal({
  stage,
  open,
  onClose,
}: {
  stage: StageWithRelations | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!stage) return null;
  const levelColor = stage.livelli?.color || "#888";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border bg-card">
        {stage.artist_image_url ? (
          <div className="w-full h-56 overflow-hidden relative">
            <img
              src={stage.artist_image_url}
              alt={stage.artist}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
            <User size={40} className="text-muted-foreground/30" />
          </div>
        )}
        <div className="p-6 space-y-4 -mt-8 relative z-10">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-black tracking-tight">
              {stage.artist}
            </DialogTitle>
          </DialogHeader>
          <div className="text-base text-muted-foreground font-medium">{stage.title}</div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
              <Clock size={13} className="text-primary" />
              {formatTime(stage.start_time)} – {formatTime(stage.end_time)}
            </span>
            {stage.sale && (
              <span className="flex items-center gap-1.5 text-sm bg-secondary px-3 py-1.5 rounded-lg" style={{ color: stage.sale.color }}>
                <MapPin size={13} />
                {stage.sale.name}
              </span>
            )}
            {stage.giorni && (
              <span className="text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
                {stage.giorni.name}
              </span>
            )}
          </div>

          {stage.livelli && (
            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md"
              style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
            >
              {stage.livelli.name}
            </span>
          )}

          {stage.description && (
            <div className="pt-3 border-t border-border">
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">{stage.description}</p>
            </div>
          )}

          {stage.notes && (
            <p className="text-sm text-muted-foreground italic bg-secondary/50 p-3 rounded-lg">{stage.notes}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
