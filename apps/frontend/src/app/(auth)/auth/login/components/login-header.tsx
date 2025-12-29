import { Bike } from "lucide-react";

export function LoginHeader() {
  return (
    <div className="text-center animate-fade-in mb-6">
      <div className="flex items-center justify-center">
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-floating">
          <Bike className="h-12 w-12 text-white" />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
        MeBike
      </h1>
    </div>
  );
}
