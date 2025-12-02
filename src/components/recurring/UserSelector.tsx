import { useUsers } from "@/hooks/useConvexData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserSelectorProps {
  selectedUserId: string;
  onChange: (userId: string) => void;
}

const UserSelector = ({ selectedUserId, onChange }: UserSelectorProps) => {
  const users = useUsers() ?? [];

  return (
    <div className="space-y-2">
      <Label>Paid By</Label>
      <Select value={selectedUserId} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user._id} value={user._id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.photoUrl} />
                  <AvatarFallback>{user.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{user.username}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;
