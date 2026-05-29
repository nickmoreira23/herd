"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/locale-context";

/**
 * Rendered when the invitation is freshly ACCEPTED. Drives the cross-subdomain
 * navigation client-side (window.location.href — redirect() does not cross
 * subdomains reliably under Turbopack; see lesson N2 / login flow).
 *
 * This neutralizes the post-action RSC-revalidation race: whether AcceptForm's
 * own redirect effect wins or the page refresh unmounts it first, this
 * component re-issues the navigation on mount, so it always lands.
 */
export function AcceptedRedirect({
  redirectUrl,
  orgName,
}: {
  redirectUrl: string;
  orgName: string;
}) {
  const t = useT();

  useEffect(() => {
    window.location.href = redirectUrl;
  }, [redirectUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
        <p className="text-gray-900 font-medium">
          {t("invitations.accept.redirecting")} <strong>{orgName}</strong>
        </p>
      </div>
    </div>
  );
}
