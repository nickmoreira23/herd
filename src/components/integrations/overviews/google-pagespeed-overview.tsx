"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Gauge } from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

export default function GooglePageSpeedOverview({ isConnected }: IntegrationOverviewProps) {
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Connect Google PageSpeed to analyze your landing pages.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-medium">API Key Active</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your Google PageSpeed Insights API key is connected. The Page Performance panel in the
            landing page editor will use this key to analyze published pages.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium">What gets analyzed</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Performance score (Lighthouse)</li>
            <li>Core Web Vitals (LCP, CLS, FCP, TTFB)</li>
            <li>SEO analysis</li>
            <li>Best practices audit</li>
            <li>Top improvement opportunities</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
