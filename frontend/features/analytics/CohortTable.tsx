"use client";

import { useCohort } from "@/hooks/useCohort";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPercent } from "@/lib/utils";

function retentionColor(value: number): string {
  if (value >= 80) return "bg-[#2D9E6B] text-white";
  if (value >= 60) return "bg-[#2D9E6B]/60 text-white";
  if (value >= 40) return "bg-[#E8940A]/50 text-[#1A1A1A]";
  if (value >= 20) return "bg-[#E8940A]/30 text-[#1A1A1A]";
  if (value > 0) return "bg-[#CC3333]/20 text-[#1A1A1A]";
  return "bg-[#EAE9E4] text-[#8A8A8A]";
}

export function CohortTable() {
  const { data, isLoading, error } = useCohort();

  return (
    <Card padding={false}>
      <div className="p-6 pb-0">
        <CardHeader title="Cohort Retention" />
        <p className="text-[13px] text-[#8A8A8A] -mt-2 mb-4">
          % of users retained week over week by acquisition cohort
        </p>
      </div>

      {isLoading && (
        <div className="p-6">
          <Skeleton className="h-4 w-full mb-3" />
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-6">
          <EmptyState title="Could not load cohorts" description="Cohort data unavailable." />
        </div>
      )}

      {!isLoading && !error && !data && (
        <div className="p-6">
          <EmptyState title="No cohort data" description="Cohort retention will appear once enough user data is collected." />
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#D9D8D3]">
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Cohort
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Users
                </th>
                {data.weeks.map((w) => (
                  <th
                    key={w}
                    className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]"
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr
                  key={row.cohort}
                  className={i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}
                >
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">
                    {row.cohort}
                  </td>
                  <td className="px-4 py-3 text-right text-[#4A4A4A]">
                    {row.size.toLocaleString()}
                  </td>
                  {row.retention.map((val, wi) => (
                    <td key={wi} className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[12px] font-medium ${retentionColor(val)}`}
                      >
                        {val > 0 ? formatPercent(val, 0) : "—"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
