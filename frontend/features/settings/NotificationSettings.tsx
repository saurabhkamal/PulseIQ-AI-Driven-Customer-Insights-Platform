"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPref[] = [
  { id: "new_insights", label: "New AI Insights", description: "Notify when new AI recommendations are generated for your org", enabled: true },
  { id: "high_priority", label: "High Priority Alerts", description: "Immediate notification for high-priority insights only", enabled: true },
  { id: "trend_detected", label: "New Trend Detected", description: "Alert when the Trend Prediction agent identifies a new signal", enabled: false },
  { id: "sentiment_shift", label: "Sentiment Shift", description: "Notify when overall sentiment changes significantly week-over-week", enabled: false },
  { id: "ingestion_complete", label: "Data Ingestion Complete", description: "Confirm when a data upload or sync has finished processing", enabled: true },
  { id: "weekly_digest", label: "Weekly Digest", description: "Summary email every Monday with top insights and KPI changes", enabled: true },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function togglePref(id: string) {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    // TODO: wire to userService.updateNotificationPreferences()
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card>
      <CardHeader title="Notification Preferences" />
      <div className="space-y-4">
        {prefs.map((pref) => (
          <div key={pref.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-[#1A1A1A]">{pref.label}</p>
              <p className="text-[12px] text-[#8A8A8A] mt-0.5">{pref.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={pref.enabled}
              aria-label={`Toggle ${pref.label}`}
              onClick={() => togglePref(pref.id)}
              className={`relative shrink-0 inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#0A66C2] ${
                pref.enabled ? "bg-[#0A66C2]" : "bg-[#D9D8D3]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  pref.enabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#D9D8D3]">
        <Button variant="primary" size="md" isLoading={isSaving} onClick={handleSave}>
          Save preferences
        </Button>
        {saved && (
          <span className="text-[13px] text-[#2D9E6B] font-medium">✓ Saved</span>
        )}
      </div>
    </Card>
  );
}
