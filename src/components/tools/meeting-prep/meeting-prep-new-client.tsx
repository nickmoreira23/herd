"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMeetingPrepStore } from "@/stores/meeting-prep-store";

/**
 * Tiny shim for /admin/tools/meeting-prep/new. The store can only run on
 * the client, so this component creates a session in `useEffect` and then
 * redirects to its detail route. A ref guards the StrictMode double-effect
 * so we don't end up with two empty drafts on each visit.
 */
export function MeetingPrepNewClient() {
  const router = useRouter();
  const createSession = useMeetingPrepStore((s) => s.createSession);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const id = createSession();
    router.replace(`/admin/tools/meeting-prep/${id}`);
  }, [createSession, router]);

  return (
    <div className="p-6">
      <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
    </div>
  );
}
