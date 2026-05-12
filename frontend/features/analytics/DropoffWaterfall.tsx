"use client";

import { useFunnel } from "@/hooks/useFunnel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const SVG_W = 460;
const PAD = { top: 16, right: 16, bottom: 44, left: 52 };
const CHART_W = SVG_W - PAD.left - PAD.right;
const CHART_H = 160;
const SVG_H = PAD.top + CHART_H + PAD.bottom;

export function DropoffWaterfall() {
  const { data, isLoading, error } = useFunnel();

  return (
    <Card>
      <CardHeader title="Journey Drop-off Waterfall" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Absolute customers lost between stages
      </p>

      {isLoading && <Skeleton className="h-[220px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load funnel" description="Funnel data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No funnel data"
          description="Connect a data source to see drop-off analysis."
        />
      )}

      {!isLoading && !error && data && data.steps.length > 0 && (
        <WaterfallColumns steps={data.steps} />
      )}
    </Card>
  );
}

interface Step {
  step: string;
  count: number;
}

function WaterfallColumns({ steps }: { steps: Step[] }) {
  const maxCount = steps[0].count;
  const n = steps.length;

  const slotW = CHART_W / n;
  const barW = Math.min(slotW * 0.55, 56);

  const toY = (count: number) =>
    PAD.top + CHART_H - (count / maxCount) * CHART_H;

  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  const cols = steps.map((step, i) => {
    const dropped = i === 0 ? 0 : steps[i - 1].count - step.count;
    const x = PAD.left + i * slotW + (slotW - barW) / 2;
    const retainedTop = toY(step.count);
    const retainedH = PAD.top + CHART_H - retainedTop;
    const droppedTop = i === 0 ? retainedTop : toY(steps[i - 1].count);
    const droppedH = retainedTop - droppedTop;
    return { ...step, dropped, x, retainedTop, retainedH, droppedTop, droppedH };
  });

  return (
    <div className="overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label="Drop-off waterfall chart"
        className="min-w-[320px]"
      >
        {/* Y-axis gridlines + labels */}
        {yTicks.map((tick) => {
          const y = toY(tick);
          const label =
            tick >= 1_000 ? `${(tick / 1_000).toFixed(0)}k` : String(tick);
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + CHART_W}
                y2={y}
                stroke="#EAE9E4"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="#8A8A8A"
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Connector line: dashed horizontal at each previous retained top */}
        {cols.map((col, i) => {
          if (i === 0) return null;
          const prevTop = toY(steps[i - 1].count);
          const prevX = cols[i - 1].x + barW;
          const currX = col.x;
          return (
            <line
              key={`conn-${i}`}
              x1={prevX}
              y1={prevTop}
              x2={currX}
              y2={prevTop}
              stroke="#D9D8D3"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })}

        {cols.map((col) => {
          const midRetainedY = col.retainedTop + col.retainedH / 2;
          const midDroppedY = col.droppedTop + col.droppedH / 2;
          const labelX = col.x + barW / 2;

          return (
            <g key={col.step}>
              {/* Dropped block (floating above, red) */}
              {col.droppedH > 1 && (
                <>
                  <rect
                    x={col.x}
                    y={col.droppedTop}
                    width={barW}
                    height={col.droppedH}
                    rx={3}
                    fill="#CC3333"
                    fillOpacity={0.15}
                    stroke="#CC3333"
                    strokeWidth={1}
                    strokeOpacity={0.6}
                  />
                  {col.droppedH > 14 && (
                    <text
                      x={labelX}
                      y={midDroppedY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="#CC3333"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="600"
                    >
                      -{col.dropped.toLocaleString()}
                    </text>
                  )}
                </>
              )}

              {/* Retained column (solid blue) */}
              <rect
                x={col.x}
                y={col.retainedTop}
                width={barW}
                height={col.retainedH}
                rx={3}
                fill="#0A66C2"
              />

              {/* Count inside blue bar */}
              {col.retainedH > 20 && (
                <text
                  x={labelX}
                  y={midRetainedY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="white"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="700"
                >
                  {col.count >= 1000
                    ? `${(col.count / 1000).toFixed(1)}k`
                    : col.count}
                </text>
              )}

              {/* Stage label below X axis */}
              <text
                x={labelX}
                y={PAD.top + CHART_H + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#4A4A4A"
                fontFamily="system-ui, sans-serif"
              >
                {col.step.length > 10 ? col.step.slice(0, 9) + "…" : col.step}
              </text>
            </g>
          );
        })}

        {/* X axis baseline */}
        <line
          x1={PAD.left}
          y1={PAD.top + CHART_H}
          x2={PAD.left + CHART_W}
          y2={PAD.top + CHART_H}
          stroke="#D9D8D3"
          strokeWidth={1}
        />
      </svg>

      <div className="flex items-center gap-4 mt-1 text-[11px] text-[#8A8A8A]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#0A66C2]" />
          Retained
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-[#CC3333] bg-[#CC3333]/15" />
          Dropped
        </span>
      </div>
    </div>
  );
}
