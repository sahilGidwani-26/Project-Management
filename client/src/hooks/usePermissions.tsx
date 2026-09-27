import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();

  const isLoggedIn = !!user;

  return {
    canEditTask: isLoggedIn,
    canDeleteTask: isLoggedIn,
    canComment: isLoggedIn,
  };
}