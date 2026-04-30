"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error("Integrations page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your connected services and data sources.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold mb-1">
            Failed to load integrations
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t("shell.error.temporary_issue")}
          </p>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {t("shell.error.try_again")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
