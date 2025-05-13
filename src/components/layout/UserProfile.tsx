import { LogOut } from "lucide-react";
import { User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileProps {
  user: User | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="mt-auto p-4 border-t">
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.avatar || undefined} alt={user?.username || "User avatar"} />
          <AvatarFallback>{(user?.username?.charAt(0) || 'U').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
