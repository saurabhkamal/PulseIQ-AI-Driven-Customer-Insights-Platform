"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { DataSource } from "@/types";

const DEMO_SOURCES: DataSource[] = [
  { id: "1", name: "Shopify Sales Feed", type: "webhook", status: "active", organizationId: "org-1", lastSyncAt: "2026-04-04T08:00:00Z", createdAt: "2026-01-10T10:00:00Z" },
  { id: "2", name: "Monthly CSV Upload", type: "csv_upload", status: "active", organizationId: "org-1", lastSyncAt: "2026-04-01T12:00:00Z", createdAt: "2026-01-15T10:00:00Z" },
  { id: "3", name: "CRM REST API", type: "rest_api", status: "error", organizationId: "org-1", lastSyncAt: "2026-04-03T06:00:00Z", createdAt: "2026-02-05T10:00:00Z" },
  { id: "4", name: "Review Scraper Feed", type: "webhook", status: "paused", organizationId: "org-1", createdAt: "2026-03-01T10:00:00Z" },
];

const STATUS_STYLES: Record<DataSource["status"], string> = {
  active: "bg-[#2D9E6B]/10 text-[#2D9E6B]",
  error: "bg-[#CC3333]/10 text-[#CC3333]",
  paused: "bg-[#E8940A]/10 text-[#E8940A]",
};

const TYPE_LABELS: Record<DataSource["type"], string> = {
  rest_api: "REST API",
  csv_upload: "CSV Upload",
  webhook: "Webhook",
};

export function DataSourcesList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm">+ Add Data Source</Button>
      </div>
      {DEMO_SOURCES.map((source) => (
        <Card key={source.id}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-[15px] font-semibold text-[#1A1A1A]">{source.name}</h3>
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[source.status]}`}>
                  {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#8A8A8A]">
                <span>Type: <span className="text-[#4A4A4A] font-medium">{TYPE_LABELS[source.type]}</span></span>
                <span>Created: <span className="text-[#4A4A4A]">{formatDate(source.createdAt)}</span></span>
                {source.lastSyncAt && (
                  <span>Last sync: <span className="text-[#4A4A4A]">{formatRelativeTime(source.lastSyncAt)}</span></span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">Configure</Button>
              {source.status === "error" && <Button variant="danger" size="sm">Retry</Button>}
              {source.status === "active" && <Button variant="secondary" size="sm">Pause</Button>}
              {source.status === "paused" && <Button variant="secondary" size="sm">Resume</Button>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
