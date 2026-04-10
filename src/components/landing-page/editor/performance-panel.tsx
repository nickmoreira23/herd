"use client";

import { useState } from "react";
import { Gauge, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";

interface WebVital {
  value: string;
  score: number;
}

interface PageSpeedScores {
  performance: number;
  seo: number;
  bestPractices: number;
}

interface StrategyResult {
  strategy: "mobile" | "desktop";
  scores: PageSpeedScores;
  webVitals: {
    lcp: WebVital;
    cls: WebVital;
    fcp: WebVital;
    ttfb: WebVital;
  };
  opportunities: Array<{
    title: string;
    description: string;
    displayValue?: string;
  }>;
}

interface PageSpeedData {
  url: string;
  mobile: StrategyResult;
  desktop: StrategyResult;
}

function scoreColor(score: number): string {
  if (score >= 90) return "#0cce6b";
  if (score >= 50) return "#ffa400";
  return "#ff4e42";
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="24"
          fontWeight="700"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function VitalRow({ label, vital }: { label: string; vital: WebVital }) {
  const color = scoreColor(vital.score * 100);
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs font-mono" style={{ color }}>
        {vital.value}
      </span>
    </div>
  );
}

function StrategyPanel({ result }: { result: StrategyResult }) {
  return (
    <div className="space-y-4">
      {/* Score gauges */}
      <div className="flex justify-around">
        <ScoreGauge score={result.scores.performance} label="Performance" />
        <ScoreGauge score={result.scores.seo} label="SEO" />
        <ScoreGauge score={result.scores.bestPractices} label="Best Practices" />
      </div>

      {/* Web Vitals */}
      <div className="rounded-lg border p-3">
        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          Core Web Vitals
        </p>
        <VitalRow label="LCP (Largest Contentful Paint)" vital={result.webVitals.lcp} />
        <VitalRow label="CLS (Cumulative Layout Shift)" vital={result.webVitals.cls} />
        <VitalRow label="FCP (First Contentful Paint)" vital={result.webVitals.fcp} />
        <VitalRow label="TTFB (Time to First Byte)" vital={result.webVitals.ttfb} />
      </div>

      {/* Opportunities */}
      {result.opportunities.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Opportunities
          </p>
          {result.opportunities.map((opp, i) => (
            <div key={i} className="py-1.5 border-b border-border/50 last:border-0">
              <p className="text-xs font-medium">{opp.title}</p>
              {opp.displayValue && (
                <p className="text-xs text-muted-foreground">{opp.displayValue}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PerformancePanel() {
  const page = useLandingPageEditorStore((s) => s.page);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PageSpeedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mobile" | "desktop">("mobile");

  const isPublished = page?.status === "PUBLISHED";

  const runAnalysis = async () => {
    if (!page) return;
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/landing-pages/${page.id}/pagespeed`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to run analysis");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        title={isPublished ? "Check performance" : "Publish first to check performance"}
        disabled={!isPublished}
        onClick={() => {
          setIsOpen(true);
          if (!data) runAnalysis();
        }}
      >
        <Gauge className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Page Performance</h3>
        <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "mobile"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
          onClick={() => setActiveTab("mobile")}
        >
          Mobile
        </button>
        <button
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "desktop"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
          onClick={() => setActiveTab("desktop")}
        >
          Desktop
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Running PageSpeed analysis...
            </p>
            <p className="text-xs text-muted-foreground">This takes 15-30 seconds</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 p-4 text-center">
            <p className="text-xs text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={runAnalysis}>
              Try again
            </Button>
          </div>
        )}

        {data && !isLoading && (
          <StrategyPanel
            result={activeTab === "mobile" ? data.mobile : data.desktop}
          />
        )}
      </div>

      {/* Footer */}
      {data && !isLoading && (
        <div className="border-t p-3">
          <Button variant="outline" size="sm" className="w-full" onClick={runAnalysis}>
            Re-run analysis
          </Button>
        </div>
      )}
    </div>
  );
}
