import { useState } from "react";
import { useEventi } from "@/hooks/useScheduleData";
import StagesManager from "./StagesManager";
import RoomsManager from "./RoomsManager";
import LevelsManager from "./LevelsManager";
import DaysManager from "./DaysManager";
import EventsManager from "./EventsManager";

const tabs = ["Stages", "Rooms", "Levels", "Days"] as const;

export default function AdminDashboard() {
  const { data: eventi } = useEventi();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Stages");
  const [showEvents, setShowEvents] = useState(true);

  const selectedEvent = eventi?.find((e) => e.id === selectedEventId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Events Manager - always accessible */}
      <div>
        <button
          onClick={() => setShowEvents(!showEvents)}
          className="font-heading font-bold text-lg text-foreground mb-3 flex items-center gap-2"
        >
          📋 Events Management
          <span className="text-sm text-muted-foreground">{showEvents ? "▲" : "▼"}</span>
        </button>
        {showEvents && <EventsManager />}
      </div>

      {/* Event selector for sub-resources */}
      <div className="border-t border-border pt-6">
        <h2 className="font-heading font-bold text-lg text-foreground mb-3">Manage Event Data</h2>
        <select
          value={selectedEventId || ""}
          onChange={(e) => setSelectedEventId(e.target.value || null)}
          className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
        >
          <option value="">— Select an event —</option>
          {eventi?.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>

        {selectedEventId && selectedEvent && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Managing: <span className="font-semibold text-foreground">{selectedEvent.name}</span>
            </p>
            <div className="flex gap-2 flex-wrap mb-4">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-lg font-heading text-sm font-semibold transition-all ${
                    activeTab === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {activeTab === "Stages" && <StagesManager eventoId={selectedEventId} />}
            {activeTab === "Rooms" && <RoomsManager eventoId={selectedEventId} />}
            {activeTab === "Levels" && <LevelsManager eventoId={selectedEventId} />}
            {activeTab === "Days" && <DaysManager eventoId={selectedEventId} />}
          </>
        )}

        {!selectedEventId && (
          <p className="text-muted-foreground text-sm italic text-center py-8">
            Seleziona un evento per gestire sale, livelli, giorni e stage.
          </p>
        )}
      </div>
    </div>
  );
}
