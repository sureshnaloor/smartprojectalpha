import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export function UserProfile() {
  const { user, loading, authenticated, checkAuth } = useAuth();

  // Debug logging
  console.log("UserProfile render:", { user, loading, authenticated, userName: user?.name });

  // Re-check auth if we have authenticated=true but no user (edge case)
  useEffect(() => {
    if (authenticated && !user && !loading) {
      console.log("⚠️ Authenticated but no user data, re-checking auth...");
      checkAuth();
    }
  }, [authenticated, user, loading, checkAuth]);

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
        <span className="text-sm font-medium hidden md:block text-gray-400">
          Loading...
        </span>
      </div>
    );
  }

  // Show user info if available
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 border-2 border-gray-200">
          {user.picture ? (
            <AvatarImage src={user.picture} alt={user.name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-primary-600 text-white text-sm font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden md:block text-gray-700">
          {user.name}
        </span>
      </div>
    );
  }

  // Fallback if no user (shouldn't happen if authenticated, but just in case)
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-xs text-gray-600">?</span>
      </div>
      <span className="text-sm font-medium hidden md:block text-gray-500">
        Guest
      </span>
    </div>
  );
}

