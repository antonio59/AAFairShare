import { LogOut } from "lucide-react";
import { User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileProps {
  user: User | null;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  return (
    <div className="mt-auto p-4 border-t">
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.avatar} alt={user?.username || "User avatar"} />
          <AvatarFallback>{(user?.username?.charAt(0) || 'U').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
          <button 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            onClick={onLogout}
          >
            <LogOut className="h-3 w-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
