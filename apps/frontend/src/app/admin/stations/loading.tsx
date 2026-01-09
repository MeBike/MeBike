import { Skeleton } from "@/components/ui/skeleton"

export default function StationManagementSkeleton() {
  return (
    <div className="p-8 space-y-8 w-full max-w-[1400px] mx-auto">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" /> 
        </div>
        <Skeleton className="h-10 w-[140px] rounded-md" /> 
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border rounded-xl flex justify-between items-center shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-[60px]" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" /> 
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-12 flex-1 rounded-md" /> 
        <Skeleton className="h-12 w-[100px] rounded-md" />
      </div>
      <div className="border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex justify-between border-b pb-4 px-2">
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[10%]" />
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex justify-between items-center py-4 px-2 border-b last:border-0">
            <div className="flex items-center gap-3 w-[15%]">
              <Skeleton className="h-10 w-10 rounded-full" /> 
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-4 w-[15%]" />
            <Skeleton className="h-4 w-[15%]" />
            <Skeleton className="h-4 w-[15%]" />
            <Skeleton className="h-6 w-[80px] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}