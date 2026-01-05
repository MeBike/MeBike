import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6 ">
      <div className="flex flex-col space-y-4 w-full max-w-md"> 
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}