import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbacksLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-96" />
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-20" />
            {Array.from({ length: 2 }).map((_, j) => (
              <Skeleton key={j} className="h-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
