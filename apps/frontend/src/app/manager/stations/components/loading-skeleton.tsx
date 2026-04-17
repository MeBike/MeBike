export function ReportSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-40 bg-muted rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted rounded-lg w-full" />
      <div className="h-64 bg-muted rounded-lg w-full" />
    </div>
  );
}