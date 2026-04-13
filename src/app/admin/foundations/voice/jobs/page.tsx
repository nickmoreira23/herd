"use client";

import { useState, useEffect, useCallback } from "react";

interface VoiceJob {
  id: string;
  operation: string;
  provider: string;
  status: string;
  audioDurationSec: number | null;
  costCents: number | null;
  errorMessage: string | null;
  sourceType: string | null;
  sourceId: string | null;
  outputUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function VoiceJobsPage() {
  const [jobs, setJobs] = useState<VoiceJob[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ operation: "", status: "" });
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.operation) params.set("operation", filter.operation);
    if (filter.status) params.set("status", filter.status);
    params.set("limit", "50");

    try {
      const res = await fetch(`/api/foundation/voice/jobs?${params}`);
      const json = await res.json();
      if (json.data) {
        setJobs(json.data.jobs);
        setTotal(json.data.total);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voice Jobs</h1>
        <p className="text-muted-foreground mt-1">
          History of all voice operations — transcriptions, syntheses, and sessions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filter.operation}
          onChange={(e) => setFilter({ ...filter, operation: e.target.value })}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Operations</option>
          <option value="transcribe">Transcribe</option>
          <option value="synthesize">Synthesize</option>
          <option value="voice_session">Voice Session</option>
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
        </select>
        <span className="text-sm text-muted-foreground flex items-center">
          {total} total
        </span>
      </div>

      {/* Jobs Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Operation</th>
              <th className="text-left px-4 py-2 font-medium">Provider</th>
              <th className="text-left px-4 py-2 font-medium">Duration</th>
              <th className="text-left px-4 py-2 font-medium">Source</th>
              <th className="text-left px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        job.status === "completed"
                          ? "bg-green-500/10 text-green-600"
                          : job.status === "failed"
                            ? "bg-red-500/10 text-red-600"
                            : job.status === "processing"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          job.status === "completed"
                            ? "bg-green-500"
                            : job.status === "failed"
                              ? "bg-red-500"
                              : job.status === "processing"
                                ? "bg-yellow-500"
                                : "bg-muted-foreground"
                        }`}
                      />
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 capitalize">{job.operation}</td>
                  <td className="px-4 py-2">{job.provider}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {job.audioDurationSec ? `${Math.round(job.audioDurationSec)}s` : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {job.sourceType ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
