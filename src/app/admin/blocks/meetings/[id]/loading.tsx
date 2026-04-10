import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function MeetingDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4 pl-4 pt-2">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96 mt-2" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <Skeleton className="h-12 w-full" />
          </Card>
          <Card className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
          <Card className="p-4 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
