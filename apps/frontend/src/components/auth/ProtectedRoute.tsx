"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth,UserRole } from "../../../utils/checkAuth";
import fetchHttpClient from "@/lib/httpClient";
interface ProtectedRouteProps{
    children:React.ReactNode;
    requiredRole?:UserRole;
    loadingComponent?:React.ReactNode;
}

export default function ProtectedRoute({
    children,
    requiredRole,
    loadingComponent
}: (ProtectedRouteProps)) {
    const router = useRouter();
    const [isAuthorized,setIsAuthorized] = useState<boolean | null>(null);
    const [isValidating,setIsValidating] = useState<boolean>(true);
    useEffect(()=>{
        const validateAuth = async () => {
            try {
                const authResult = checkAuth(requiredRole);
                if(!authResult.isAuthenticated){
                    router.push(authResult.redirectTo || "/login");
                    return;
                }
                const isServerValid = await validateTokenWithServer();
                if (!isServerValid) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user_role");
                    router.push("/login");
                    return;
                }
                if(!authResult.hasPermission){
                    router.push("/unauthorized");
                    return;
                }
                setIsAuthorized(true);
            } catch (error) {
                console.error("Auth validation failed", error);
                router.push("/login");
                
            }finally{
                setIsValidating(false)
            }
        }
        validateAuth();
    },[router,requiredRole]);
const validateTokenWithServer = async() : Promise<boolean> => {
        try {
       const response = await fetchHttpClient.get("/api/auth/validate");
       return (response as Response).ok;
    } catch (error) {
        console.error("Token validation failed:", error);
        return false;
    }
}
    if (isValidating || isAuthorized === null) {
        return loadingComponent ? <>{loadingComponent}</> : (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    return isAuthorized ? <>{children}</> : null;
}