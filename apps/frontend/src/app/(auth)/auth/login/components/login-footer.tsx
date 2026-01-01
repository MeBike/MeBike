import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
export default function LoginFooter() {
    const router = useRouter();
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?
          <Button variant="link" onClick={() => router.push("/auth/register")}>
            Sign Up
          </Button>
        </p>
        <Button variant="link" onClick={() => router.push("/")}>
          ← Back to home
        </Button>
      </div>
    );
}