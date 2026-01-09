import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@components/ui/card";
import { Separator } from "@components/ui/separator";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)]">
      <div className="w-full max-w-md">
        {/* Login Header Skeleton */}
        <div className="flex flex-col items-center space-y-2 mb-6">
           <Skeleton className="h-12 w-12 rounded-full" />
           <Skeleton className="h-6 w-32" />
        </div>

        <Card className="shadow-floating border-0 bg-white/95 backdrop-blur-xl animate-scale-in">
          <div className="h-1 bg-gradient-metro rounded-t-lg" />
          <CardHeader className="text-center space-y-2">
            <Skeleton className="h-8 w-1/3 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            
            <Separator className="my-6" />
            
             {/* Footer Skeleton */}
            <div className="flex justify-center space-x-4">
                 <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}