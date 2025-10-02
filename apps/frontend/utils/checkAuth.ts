

export type UserRole = "user" | "staff" | "admin";
export interface AuthResult {
    isAuthenticated: boolean;
    hasPermission: boolean;
    redirectTo?: string | null;
}
const isValidToken = (token:string):boolean => {
    try{
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 > Date.now();
    }catch{
        return false;
    }
}
const isValidRole = (role:string) : role is UserRole => {
    return ["user","staff","admin"].includes(role);
}
const checkRolePermission = (userRole : UserRole, requiredRole: UserRole): boolean => {
    return userRole === requiredRole;
}
export const checkAuth = (requiredRole?: UserRole): AuthResult => {
    try {
        const token = localStorage.getItem("access_token");
        const userRole = localStorage.getItem("user_role") as UserRole | null;
        if(!token || !isValidToken(token)){
            return {
                isAuthenticated: false,
                hasPermission: false,
                redirectTo: "/login"
            }
        }
        if(!userRole || !isValidRole(userRole)){
            return {
                isAuthenticated: false,
                hasPermission: false,
                redirectTo: "/login"
            }
        }
        if(!requiredRole){
            return {
                isAuthenticated: true,
                hasPermission: true,
            }
        }
        const hasPermission = checkRolePermission(userRole, requiredRole);
        return {
            isAuthenticated: true,
            hasPermission : hasPermission,
            redirectTo: hasPermission ? null : "/unauthorized"
        }
    } catch (error) {
         console.error("Auth check failed:", error);
        return {
            isAuthenticated: false,
            hasPermission: false,
            redirectTo: "/login"
        }
    }
}