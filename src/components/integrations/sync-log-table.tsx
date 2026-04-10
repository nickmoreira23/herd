"use client";

import { Badge } from "@/components/ui/badge";

interface SyncLog {
  id: string;
  action: string;
  status: string;
  details: string | null;
  recordsProcessed: number;
  createdAt: string;
}

interface SyncLogTableProps {
  logs: SyncLog[];
}

export function SyncLogTable({ logs }: SyncLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No sync logs yet.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Action</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Records</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Details</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b last:border-0">
              <td className="px-4 py-2.5 font-mono text-xs">{log.action}</td>
              <td className="px-4 py-2.5">
                <Badge
                  className={`text-[10px] ${
                    log.status === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {log.status}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {log.recordsProcessed > 0 ? log.recordsProcessed : "—"}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">
                {log.details || "—"}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
