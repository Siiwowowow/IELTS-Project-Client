//src/hooks/useUser.ts
import { useAuth } from "@/providers/AuthProvider";
import { ICurrentUser } from "@/types/user.types";

export const useUser = () => {
    const { user, setUser, logout, isLoading } = useAuth();
    
    return { 
        user, 
        setUser: setUser as (user: ICurrentUser | null) => void,
        logout,
        isLoading,
    };
};