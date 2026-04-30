"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale-context";

export default function AdminNotFound() {
  const t = useT();

  return (
    <div className="p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            {t("shell.error.page_not_found")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {t("shell.error.page_not_found_description")}
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("shell.error.go_home")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
