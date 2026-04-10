"use client";

import { useEffect } from "react";

export function WebVitalsReporter() {
  useEffect(() => {
    async function reportVitals() {
      try {
        const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import(
          "web-vitals"
        );

        const sendMetric = (metric: { name: string; value: number; id: string }) => {
          // Send to GA4 if available
          if (typeof window !== "undefined" && "gtag" in window) {
            (window as Record<string, unknown> & { gtag: (...args: unknown[]) => void }).gtag("event", metric.name, {
              value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
              event_label: metric.id,
              non_interaction: true,
            });
          }

          // Send to our API
          const slug = window.location.pathname.replace("/p/", "");
          navigator.sendBeacon?.(
            "/api/analytics/web-vitals",
            JSON.stringify({
              name: metric.name,
              value: metric.value,
              id: metric.id,
              pageSlug: slug,
            })
          );
        };

        onCLS(sendMetric);
        onINP(sendMetric);
        onLCP(sendMetric);
        onFCP(sendMetric);
        onTTFB(sendMetric);
      } catch {
        // web-vitals not available — fail silently
      }
    }

    reportVitals();
  }, []);

  return null;
}
