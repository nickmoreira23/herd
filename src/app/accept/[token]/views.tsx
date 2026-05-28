"use client";

import type { InvitationStatus } from "@prisma/client";
import Link from "next/link";
import { useT } from "@/lib/i18n/locale-context";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center text-foreground">
        {children}
      </div>
    </div>
  );
}

export function InvitationNotFoundView() {
  const t = useT();
  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{t("invitations.view.not_found_title")}</h1>
      <p className="text-gray-500 mb-6">
        {t("invitations.view.not_found_body")}
      </p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        {t("invitations.view.go_home")}
      </Link>
    </Card>
  );
}

export function InvitationExpiredView() {
  const t = useT();
  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{t("invitations.view.expired_title")}</h1>
      <p className="text-gray-500 mb-6">
        {t("invitations.view.expired_body")}
      </p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        {t("invitations.view.go_home")}
      </Link>
    </Card>
  );
}

export function InvitationAlreadyProcessedView({
  status,
}: {
  status: InvitationStatus;
}) {
  const t = useT();

  const statusMessage: Record<InvitationStatus, string> = {
    ACCEPTED: t("invitations.view.already_accepted"),
    DECLINED: t("invitations.view.declined"),
    EXPIRED: t("invitations.view.already_expired"),
    PENDING: "",
  };

  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{t("invitations.view.unavailable_title")}</h1>
      <p className="text-gray-500 mb-6">{statusMessage[status]}</p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        {t("invitations.view.go_home")}
      </Link>
    </Card>
  );
}
