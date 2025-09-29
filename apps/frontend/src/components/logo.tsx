import { Bike } from "lucide-react";
import { useRouter } from "next/navigation";
export function Logo() {
  const router = useRouter();
  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => router.push("/")}
    >
      <div className="rounded-full bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] p-3 shadow-[var(--shadow-metro)]">
        <Bike className="h-8 w-8 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          MetroBike
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          The Last Mile Solution
        </p>
      </div>
    </div>
  );
}
