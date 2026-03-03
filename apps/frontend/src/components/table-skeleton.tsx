import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton({ rowCount = 7 }: { rowCount?: number }) {
  return (
    <Card className="w-full">
      {/* Skeleton cho phần Header của Card */}
      <CardHeader className="space-y-2">
        <div className="h-6 w-1/4 bg-muted animate-pulse rounded-md" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Skeleton cho ô Search Input */}
          <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />

          {/* Table Structure */}
          <div className="overflow-x-auto">
            <div className="w-full">
              {/* Table Head Skeleton */}
              <div className="flex border-b py-3 px-4 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 flex-1 bg-muted animate-pulse rounded" />
                ))}
              </div>

              {/* Table Rows Skeleton */}
              <div className="divide-y">
                {Array.from({ length: rowCount }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex py-4 px-4 gap-4 items-center">
                    {[1, 2, 3, 4, 5].map((cellIndex) => (
                      <div 
                        key={cellIndex} 
                        className="h-4 flex-1 bg-muted/60 animate-pulse rounded" 
                        style={{ 
                          // Tạo độ dài ngắn khác nhau cho nhìn tự nhiên
                          width: `${Math.floor(Math.random() * (100 - 40 + 1) + 40)}%` 
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}