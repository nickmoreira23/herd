import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";

export default async function VoiceDashboardPage() {
  await connection();

  const [totalJobs, completedJobs, failedJobs, recentJobs, transcribeCount, synthesizeCount] =
    await Promise.all([
      prisma.voiceJob.count(),
      prisma.voiceJob.count({ where: { status: "completed" } }),
      prisma.voiceJob.count({ where: { status: "failed" } }),
      prisma.voiceJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.voiceJob.count({ where: { operation: "transcribe" } }),
      prisma.voiceJob.count({ where: { operation: "synthesize" } }),
    ]);

  const stats = [
    { label: "Total Jobs", value: totalJobs },
    { label: "Completed", value: completedJobs },
    { label: "Failed", value: failedJobs },
    { label: "Transcriptions", value: transcribeCount },
    { label: "Syntheses", value: synthesizeCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voice</h1>
          <p className="text-muted-foreground mt-1">
            Speech-to-text, text-to-speech, and real-time voice capabilities.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/foundations/voice/providers"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Providers
          </Link>
          <Link
            href="/admin/foundations/voice/jobs"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Job History
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Provider Status */}
      <div className="rounded-lg border p-5">
        <h2 className="font-semibold mb-3">Active Providers</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ProviderCard
            capability="Speech-to-Text"
            provider="Deepgram"
            model="Nova-3"
          />
          <ProviderCard
            capability="Text-to-Speech"
            provider="ElevenLabs"
            model="Multilingual v2"
          />
          <ProviderCard
            capability="Voice Mode"
            provider="Not configured"
            model="—"
            inactive
          />
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Jobs</h2>
          <Link
            href="/admin/foundations/voice/jobs"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No voice jobs yet. Jobs appear here when transcriptions or syntheses are run.
          </p>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      job.status === "completed"
                        ? "bg-green-500"
                        : job.status === "failed"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <span className="font-medium capitalize">{job.operation}</span>
                  <span className="text-muted-foreground">{job.provider}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  {job.audioDurationSec && (
                    <span>{Math.round(job.audioDurationSec)}s</span>
                  )}
                  <span>
                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderCard({
  capability,
  provider,
  model,
  inactive,
}: {
  capability: string;
  provider: string;
  model: string;
  inactive?: boolean;
}) {
  return (
    <div className={`rounded-md border p-3 ${inactive ? "opacity-50" : ""}`}>
      <p className="text-xs text-muted-foreground">{capability}</p>
      <p className="font-medium mt-0.5">{provider}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{model}</p>
    </div>
  );
}
