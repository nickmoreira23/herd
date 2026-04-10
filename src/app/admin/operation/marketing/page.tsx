import { Megaphone } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Campaigns, content, and marketing operations.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="rounded-lg bg-muted/50 p-3 mb-4">
            <Megaphone className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-base">Coming soon</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Campaign management, content planning, and marketing analytics will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
