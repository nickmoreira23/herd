"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Handshake } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { useMeetingPrepStore } from "@/stores/meeting-prep-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/i18n/format-relative-time";
import { notifySuccess } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

export function MeetingPrepListClient() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Selecting the raw record keeps the selector stable across renders.
  // `listSessions()` would build a new array on every call and trip
  // Zustand's "store shouldn't return new references on each render" guard.
  const sessionsMap = useMeetingPrepStore((s) => s.sessions);
  const sessions = useMemo(
    () =>
      Object.values(sessionsMap).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [sessionsMap],
  );
  const createSession = useMeetingPrepStore((s) => s.createSession);
  const deleteSession = useMeetingPrepStore((s) => s.deleteSession);

  const handleNew = () => {
    const id = createSession();
    router.push(`/admin/tools/meeting-prep/${id}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("meeting_prep.list.delete_confirm"))) return;
    deleteSession(id);
    notifySuccess("meeting_prep.feedback.session_deleted", t);
  };

  return (
    <div className="space-y-6 px-4">
      <PageHeader
        crumbs={[{ label: t("meeting_prep.briefing.crumb"), href: "/admin/tools" }]}
        title={t("meeting_prep.list.title")}
        description={t("meeting_prep.list.description")}
        action={
          <Button onClick={handleNew} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            {t("meeting_prep.list.new_session")}
          </Button>
        }
      />

      {!hydrated ? (
        <div className="space-y-2">
          <div className="h-12 rounded bg-muted animate-pulse" />
          <div className="h-12 rounded bg-muted animate-pulse" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="mx-auto rounded-full bg-violet-100 dark:bg-violet-950/50 p-3 w-fit mb-4">
            <Handshake className="h-6 w-6 text-violet-600" />
          </div>
          <h3 className="font-semibold">
            {t("meeting_prep.list.empty_title")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {t("meeting_prep.list.empty_body")}
          </p>
          <Button
            onClick={handleNew}
            className="mt-4 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("meeting_prep.list.new_session")}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">
                  {t("meeting_prep.list.column.title")}
                </th>
                <th className="text-left font-medium px-4 py-3">
                  {t("meeting_prep.list.column.type")}
                </th>
                <th className="text-left font-medium px-4 py-3">
                  {t("meeting_prep.list.column.status")}
                </th>
                <th className="text-left font-medium px-4 py-3">
                  {t("meeting_prep.list.column.updated")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tools/meeting-prep/${session.id}`}
                      className="font-medium hover:text-violet-600"
                    >
                      {session.title.trim() ||
                        t("meeting_prep.list.untitled")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.context.meetingType
                      ? t(
                          `meeting_prep.meeting_type.${session.context.meetingType}` as MessageKey,
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        session.status === "draft" ? "secondary" : "default"
                      }
                      className="text-[10px] uppercase tracking-wider"
                    >
                      {t(
                        `meeting_prep.status.${session.status}` as MessageKey,
                      )}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                    {formatRelativeTime(new Date(session.updatedAt), locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
