import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/integrations/category-meta";
import { IntegrationsPageClient } from "@/components/integrations/integrations-page-client";
import { SyncLogTable } from "@/components/integrations/sync-log-table";
import type { IntegrationCategory } from "@prisma/client";

interface CategoryHubProps {
  category: IntegrationCategory;
}

export async function CategoryHub({ category }: CategoryHubProps) {
  const meta = CATEGORY_META[category];

  const [integrations, syncLogs, voiceJobs, videoJobs] = await Promise.all([
    prisma.integration.findMany({
      where: { category },
      orderBy: { name: "asc" },
    }),
    prisma.integrationSyncLog.findMany({
      where: { integration: { category } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    meta.jobsKind === "voice"
      ? prisma.voiceJob.findMany({
          where: { integration: { category } },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
    meta.jobsKind === "video"
      ? prisma.videoJob.findMany({
          where: { integration: { category } },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
  ]);

  const connected = integrations.filter((i) => i.status === "CONNECTED");
  const available = integrations.filter((i) => i.status === "AVAILABLE");

  const stats = [
    { label: "Total", value: String(integrations.length) },
    { label: "Connected", value: String(connected.length) },
    { label: "Available", value: String(available.length) },
  ];

  return (
    <div className="space-y-8">
      <IntegrationsPageClient
        initialIntegrations={JSON.parse(JSON.stringify(integrations))}
        stats={stats}
        title={meta.title}
        description={meta.description}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Activity Logs</h2>
        <p className="text-sm text-muted-foreground">
          Sync events across every {meta.title.toLowerCase()} integration.
        </p>
        <SyncLogTable
          logs={syncLogs.map((l) => ({
            id: l.id,
            action: l.action,
            status: l.status,
            details: l.details,
            recordsProcessed: l.recordsProcessed,
            createdAt: l.createdAt.toISOString(),
          }))}
        />
      </section>

      {meta.jobsKind === "voice" && (
        <JobsSection
          title="Voice Jobs"
          jobs={voiceJobs.map((j) => ({
            id: j.id,
            operation: j.operation,
            provider: j.provider,
            status: j.status,
            durationSec: j.audioDurationSec,
            createdAt: j.createdAt.toISOString(),
          }))}
        />
      )}

      {meta.jobsKind === "video" && (
        <JobsSection
          title="Video Jobs"
          jobs={videoJobs.map((j) => ({
            id: j.id,
            operation: j.operation,
            provider: j.provider,
            status: j.status,
            durationSec: j.videoDurationSec,
            createdAt: j.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}

interface JobRow {
  id: string;
  operation: string;
  provider: string;
  status: string;
  durationSec: number | null;
  createdAt: string;
}

function JobsSection({ title, jobs }: { title: string; jobs: JobRow[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
          No jobs recorded yet.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Operation</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Provider</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        job.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : job.status === "failed"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 capitalize">{job.operation}</td>
                  <td className="px-4 py-2">{job.provider}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {job.durationSec ? `${Math.round(job.durationSec)}s` : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
