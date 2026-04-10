import { useState } from "react";
import StagesManager from "./StagesManager";
import RoomsManager from "./RoomsManager";
import LevelsManager from "./LevelsManager";
import DaysManager from "./DaysManager";

const tabs = ["Stages", "Rooms", "Levels", "Days"] as const;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Stages");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-2 flex-wrap">
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
      {activeTab === "Stages" && <StagesManager />}
      {activeTab === "Rooms" && <RoomsManager />}
      {activeTab === "Levels" && <LevelsManager />}
      {activeTab === "Days" && <DaysManager />}
    </div>
  );
}
