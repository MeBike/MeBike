import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";

export function TableSkeleton({ rowCount = 7 }: { rowCount?: number }) {
  return (
    <>
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <div className="h-6 w-1/4 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
            <div className="overflow-x-auto">
              <div className="w-full">
                <div className="flex border-b py-3 px-4 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-4 flex-1 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
                <div className="divide-y">
                  {Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex py-4 px-4 gap-4 items-center"
                    >
                      {[1, 2, 3, 4, 5].map((cellIndex) => (
                        <div
                          key={cellIndex}
                          className="h-4 flex-1 bg-muted/60 animate-pulse rounded"
                          style={{
                            width: `${Math.floor(Math.random() * (100 - 40 + 1) + 40)}%`,
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
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </>
  );
}
