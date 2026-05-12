"use client";

import { useNewVsReturning } from "@/hooks/useNewVsReturning";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NewVsReturningDay } from "@/services/analytics.service";

const W = 480;
const H = 140;
const PAD = { top: 12, right: 16, bottom: 28, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const COLOR_NEW = "#2D9E6B";
const COLOR_RETURNING = "#0A66C2";

export function NewVsReturningChart() {
  const { data, isLoading, error } = useNewVsReturning();

  const maxTotal = data
    ? Math.max(...data.map((d) => d.new_customers + d.returning_customers), 1)
    : 1;

  const totalNew = data ? data.reduce((s, d) => s + d.new_customers, 0) : 0;
  const totalReturning = data ? data.reduce((s, d) => s + d.returning_customers, 0) : 0;
  const totalAll = totalNew + totalReturning;
  const newPct = totalAll > 0 ? Math.round((totalNew / totalAll) * 100) : 0;

  const labelDates: { idx: number; label: string }[] = [];
  if (data && data.length > 1) {
    [0, Math.floor(data.length / 2), data.length - 1].forEach((idx) => {
      const parts = data[idx].date.split("-");
      labelDates.push({ idx, label: `${parts[1]}/${parts[2]}` });
    });
  }

  return (
    <Card>
      <CardHeader
        title="New vs. Returning Customers"
        action={
          data ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#2D9E6B]">{newPct}%</span> new
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">Daily unique customers · last 30 days</p>

      {isLoading && <Skeleton className="h-[140px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Customer data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No customer data"
          description="Customer events will populate this chart once data is ingested."
        />
      )}

      {!isLoading && !error && data && (
        <>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="New vs returning customers stacked bar chart"
          >
            <StackedBars data={data} maxTotal={maxTotal} />

            {/* X-axis date labels */}
            {labelDates.map(({ idx, label }) => {
              const barW = CHART_W / data.length;
              const x = PAD.left + idx * barW + barW / 2;
              return (
                <text
                  key={label}
                  x={x}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#8A8A8A"
                  fontFamily="system-ui, sans-serif"
                >
                  {label}
                </text>
              );
            })}
          </svg>

          <div className="flex items-center gap-4 mt-2 text-[11px] text-[#8A8A8A]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_NEW }} />
              New
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_RETURNING }} />
              Returning
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

function StackedBars({
  data,
  maxTotal,
}: {
  data: NewVsReturningDay[];
  maxTotal: number;
}) {
  const barW = Math.max((CHART_W / data.length) - 1, 2);

  return (
    <>
      {data.map((d, i) => {
        const x = PAD.left + i * (CHART_W / data.length);
        const total = d.new_customers + d.returning_customers;
        const totalH = (total / maxTotal) * CHART_H;
        const newH = total > 0 ? (d.new_customers / total) * totalH : 0;
        const retH = totalH - newH;

        const baseY = PAD.top + CHART_H;
        const date = d.date.split("-").slice(1).join("/");

        return (
          <g key={d.date}>
            {/* Returning (bottom) */}
            {retH > 0 && (
              <rect
                x={x}
                y={baseY - totalH}
                width={barW}
                height={retH}
                fill={COLOR_RETURNING}
                opacity={0.85}
              >
                <title>{`${date} — Returning: ${d.returning_customers}`}</title>
              </rect>
            )}
            {/* New (top) */}
            {newH > 0 && (
              <rect
                x={x}
                y={baseY - totalH}
                width={barW}
                height={newH}
                fill={COLOR_NEW}
                opacity={0.85}
              >
                <title>{`${date} — New: ${d.new_customers}`}</title>
              </rect>
            )}
          </g>
        );
      })}
    </>
  );
}
