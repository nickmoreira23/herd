import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function EventDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pl-4 pt-2">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64 mb-2" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-20 w-full" />
          </Card>
          <Card className="p-4">
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="p-4">
            <Skeleton className="h-4 w-28 mb-3" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
