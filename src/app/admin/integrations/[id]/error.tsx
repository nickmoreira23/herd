"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

export default function IntegrationDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Integration detail page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/admin/integrations")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Integrations
      </button>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold mb-1">
            Failed to load integration
          </h2>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Something went wrong while loading this integration. This is usually
            a temporary issue.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/admin/integrations")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Go Back
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
