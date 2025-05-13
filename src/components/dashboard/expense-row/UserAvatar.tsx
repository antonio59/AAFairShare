import { User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: User;
}

const UserAvatar = ({ user }: UserAvatarProps) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={user.avatar} alt={user.username} />
        <AvatarFallback>{user.username?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>
      <span>{user.username}</span>
    </div>
  );
};

export default UserAvatar;
