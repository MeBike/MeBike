import { Skeleton } from "@/components/ui/skeleton";

export function StationDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" /> {/* Title */}
          <Skeleton className="h-4 w-96" /> {/* Address */}
        </div>
        <Skeleton className="h-10 w-24" /> {/* Edit Button */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Station Information Card */}
          <div className="rounded-xl bg-card p-6 shadow-sm border">
            <Skeleton className="h-6 w-48 mb-6" /> {/* Section Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input/Value */}
                </div>
              ))}
            </div>
          </div>

          {/* Bikes Section */}
          <div className="rounded-xl bg-card p-6 shadow-sm border">
            <Skeleton className="h-6 w-56 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <Skeleton className="h-40 w-full rounded-md" /> {/* Bike Image */}
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Capacity Card */}
          <div className="rounded-xl bg-card p-6 shadow-sm border">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-xl bg-card p-6 shadow-sm border">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}