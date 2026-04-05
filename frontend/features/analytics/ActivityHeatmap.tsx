"use client";

import { useHeatmap } from "@/hooks/useHeatmap";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`
);

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "#EAE9E4";
  const intensity = value / max;
  if (intensity < 0.2) return "#DBEAFE";
  if (intensity < 0.4) return "#93C5FD";
  if (intensity < 0.6) return "#3B82F6";
  if (intensity < 0.8) return "#1D4ED8";
  return "#1E3A8A";
}

export function ActivityHeatmap() {
  const { data, isLoading, error } = useHeatmap();

  return (
    <Card>
      <CardHeader title="Activity Heatmap" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Events by hour of day &amp; day of week
      </p>

      {isLoading && <Skeleton className="h-48 w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load heatmap" description="Activity data unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState title="No activity data" description="Behavioral events will populate this chart once data is ingested." />
      )}

      {!isLoading && !error && data && (
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Hour labels - show every 3 hours */}
            <div className="flex mb-1 pl-10">
              {HOURS.map((h, i) => (
                <div key={h} className="flex-1 text-center">
                  {i % 3 === 0 && (
                    <span className="text-[10px] text-[#8A8A8A]">{h}</span>
                  )}
                </div>
              ))}
            </div>
            {/* Grid rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <span className="text-[11px] text-[#8A8A8A] w-8 shrink-0">{day}</span>
                {HOURS.map((_, hourIdx) => {
                  const cell = data.cells.find(
                    (c) => c.day === dayIdx && c.hour === hourIdx
                  );
                  const val = cell?.value ?? 0;
                  return (
                    <div
                      key={hourIdx}
                      className="flex-1 h-5 rounded-sm"
                      style={{ backgroundColor: getColor(val, data.maxValue) }}
                      title={`${day} ${HOURS[hourIdx]}: ${val.toLocaleString()} events`}
                      role="img"
                      aria-label={`${day} ${HOURS[hourIdx]}: ${val} events`}
                    />
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[11px] text-[#8A8A8A]">Less</span>
              {["#EAE9E4", "#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#1E3A8A"].map((c) => (
                <div key={c} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
              <span className="text-[11px] text-[#8A8A8A]">More</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
