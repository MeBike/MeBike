import React from "react";
import { Loader2 } from "lucide-react";
export const LoadingScreen = () => {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Đang tải thông tin chi tiết...
      </p>
    </div>
  );
};
