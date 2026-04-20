import { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clock, MapPin, User } from "lucide-react";

type StageWithRelations = Tables<"stages"> & {
  sale: Tables<"sale"> | null;
  giorni: Tables<"giorni"> | null;
  livelli: Tables<"livelli"> | null;
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

function levelColor(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("masterclass") || n.includes("bootcamp")) return "#A855F7";
  if (n.includes("avanzato") || n.includes("advanced")) return "#EF4444";
  if (n.includes("intermedio") || n.includes("base-inter")) return "#EAB308";
  if (n.includes("open") || n === "base" || n.includes("principianti")) return "#22C55E";
  return "#C9A84C";
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
  const lvl = levelColor(stage.livelli?.name || "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" style={{ background: "#0f0f0f", border: `1px solid ${lvl}30` }}>

        {/* Artist image or placeholder */}
        {stage.artist_image_url ? (
          <div className="relative w-full" style={{ height: 220 }}>
            <img src={stage.artist_image_url} alt={stage.artist} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #0f0f0f 100%)" }} />
            {/* level bar on image */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${lvl}, ${lvl}44, transparent)` }} />
          </div>
        ) : (
          <div className="relative w-full flex items-center justify-center" style={{ height: 100, background: `linear-gradient(135deg, ${lvl}15, transparent)` }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${lvl}, ${lvl}44, transparent)` }} />
            <User size={40} style={{ color: `${lvl}40` }} />
          </div>
        )}

        <div className="px-6 pb-7 pt-2 space-y-5" style={{ marginTop: stage.artist_image_url ? -24 : 0 }}>

          {/* Artist name */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-1" style={{ color: lvl }}>
              Artista
            </p>
            <h2 className="font-black text-white leading-tight" style={{ fontSize: "clamp(1.6rem, 5vw, 2rem)", letterSpacing: "-0.01em" }}>
              {stage.artist}
            </h2>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Workshop / Stage
            </p>
            <p className="font-semibold text-white" style={{ fontSize: "1.1rem", lineHeight: 1.4 }}>
              {stage.title}
            </p>
          </div>

          {/* Pills row */}
          <div className="flex flex-wrap gap-2">
            <Pill icon={<Clock size={13} />} color={lvl}>
              {formatTime(stage.start_time)} – {formatTime(stage.end_time)}
            </Pill>
            {stage.sale && (
              <Pill icon={<MapPin size={13} />} color={stage.sale.color || lvl}>
                {stage.sale.name}
              </Pill>
            )}
            {stage.giorni && (
              <Pill color="rgba(255,255,255,0.2)">
                {stage.giorni.name}
              </Pill>
            )}
          </div>

          {/* Level badge */}
          {stage.livelli && (
            <div>
              <span
                className="inline-flex items-center gap-2 font-black uppercase"
                style={{
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: `${lvl}18`,
                  color: lvl,
                  border: `1.5px solid ${lvl}50`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: lvl }} />
                {stage.livelli.name}
              </span>
            </div>
          )}

          {/* Description */}
          {stage.description && (
            <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.35em] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                Descrizione
              </p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.75)" }}>
                {stage.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {stage.notes && (
            <p className="italic rounded-xl px-4 py-3" style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {stage.notes}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Pill({ icon, color, children }: { icon?: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold"
      style={{
        fontSize: "0.8rem",
        padding: "6px 12px",
        borderRadius: 99,
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
