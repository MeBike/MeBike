import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthActions } from "@hooks/useAuthAction";
import { getAccessToken , clearTokens} from "@utils/tokenManager";
import { DetailUser } from "@services/authService";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProfileQuery } from "@hooks/query/useUserProfileQuery";
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
interface AuthError {
  response?: {
    status: number;
  };
}
type AuthContextType = ReturnType<typeof useAuthActions> & {
  user : DetailUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  actions : ReturnType<typeof useAuthActions>;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider:React.FC<{children : React.ReactNode}> = ({ children }) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: isUserProfileLoading , isError , isSuccess  } = useUserProfileQuery(hasToken);
  
  // Debug logging
  console.log('AuthProvider state:', { hasToken, isInitialized });
  
  // Callback to update hasToken when token is saved or cleared
  const handleTokenUpdate = useCallback(async () => {
    const token = await getAccessToken();
    setHasToken(!!token);
  }, []);
  
  const actions = useAuthActions(navigation, handleTokenUpdate);
  useEffect(() => {
    const initializeAuth = async () => {
      const token = await getAccessToken();
      setHasToken(!!token);
      setIsInitialized(true);
    };
    
    initializeAuth();
    
    const handleAuthFailure = async () => {
      await clearTokens();
      setHasToken(false);
      queryClient.clear();
    };

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Kiểm tra lại token khi app active
        const token = await getAccessToken();
        setHasToken(!!token);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Custom event listener for auth failures (có thể trigger từ API calls)
    // Thay thế window events bằng custom event system nếu cần
    
    return () => {
      subscription?.remove();
    };
  }, [queryClient]);
  
  useEffect(() => {
    if (isError && hasToken && isInitialized) {
      const authError = isError as unknown as AuthError;
      const hasResponse = authError?.response && typeof authError.response === "object";
      const status = hasResponse && authError.response ? authError.response.status : undefined;
      const isAuthError = hasResponse && (status === 401 || status === 403);
      
      if (isAuthError) {
        const clearAuth = async () => {
          console.log('Auth error detected, clearing auth state');
          await clearTokens();
          setHasToken(false);
          queryClient.clear();
        };
        clearAuth();
      }
    }
  }, [isError, hasToken, queryClient, isInitialized]);

  // Additional effect to ensure queries are properly disabled when token is cleared
  useEffect(() => {
    if (!hasToken && isInitialized) {
      console.log('No token detected, clearing query cache');
      queryClient.clear();
    }
  }, [hasToken, isInitialized, queryClient]);

 const value: AuthContextType = React.useMemo(() => {
    const user = userProfile as DetailUser || null;
    const isAuthenticated = !!user && isSuccess && isInitialized;
    return {
      ...actions,
      user,
      isAuthenticated,
      isLoading: isUserProfileLoading || !isInitialized,
      actions,
    };
  }, [userProfile, isUserProfileLoading, isSuccess, actions, isInitialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
