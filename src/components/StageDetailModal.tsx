import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

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
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {stage.artist_image_url && (
          <div className="w-full h-48 overflow-hidden">
            <img
              src={stage.artist_image_url}
              alt={stage.artist}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">{stage.artist}</DialogTitle>
          </DialogHeader>
          <div className="text-lg text-muted-foreground font-medium">{stage.title}</div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{formatTime(stage.start_time)} – {formatTime(stage.end_time)}</span>
            {stage.sale && (
              <span className="font-semibold" style={{ color: stage.sale.color }}>
                {stage.sale.name}
              </span>
            )}
            {stage.giorni && <span>{stage.giorni.name}</span>}
          </div>

          {stage.livelli && (
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: levelColor, color: "#000" }}
            >
              {stage.livelli.name}
            </span>
          )}

          {stage.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{stage.description}</p>
            </div>
          )}

          {stage.notes && (
            <p className="text-sm text-muted-foreground italic">{stage.notes}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
