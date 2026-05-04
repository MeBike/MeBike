"use client";

import { use, useEffect , useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBikeActions } from "@/hooks/use-bike";
import { BikeDetailView } from "./BikeDetail"; 
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { notFound } from "next/navigation";
export default function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const {
    myBikeInStationDetail,
    getMyBikeInStationDetail,
    isLoadingMyBikeInStationDetail,
  } = useBikeActions({ hasToken: true, bike_detail_id: id });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
    useEffect(() => {
      if (isLoadingMyBikeInStationDetail) {
        setIsVisualLoading(true);
      } else {
        const timer = setTimeout(() => {
          setIsVisualLoading(false);
        }, 600);
        return () => clearTimeout(timer);
      }
    }, [isLoadingMyBikeInStationDetail]);
    useEffect(() => {
      getMyBikeInStationDetail();
    }, [id]);
    if (isVisualLoading) {
      return <LoadingScreen />;
    }
    if(!myBikeInStationDetail){
      notFound();
    }
  return (
    <div className="min-h-[calc(100vh-5rem)] p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <BikeDetailView 
          bike={myBikeInStationDetail} 
        />
      </div>
    </div>
  );
}