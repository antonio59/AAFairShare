import { useUsers } from "@/hooks/useConvexData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface UserSelectorProps {
  selectedUserId: string;
  onChange: (userId: string) => void;
  label?: string;
}

const UserSelector = ({
  selectedUserId,
  onChange,
  label = "Paid By",
}: UserSelectorProps) => {
  const usersData = useUsers();
  const users = usersData ?? [];
  const isLoading = usersData === undefined;

  const selectedUser = users.find((u) => u._id === selectedUserId);

  if (isLoading) {
    return (
      <div>
        <Label className="text-sm font-medium mb-2 block">{label}</Label>
        <div className="flex items-center justify-center py-3 border rounded-md border-input bg-background">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading users...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <Select value={selectedUserId} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select user">
            {selectedUser && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={selectedUser.image || selectedUser.photoUrl || ""}
                  />
                  <AvatarFallback className="text-xs">
                    {(selectedUser.username || selectedUser.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {selectedUser.username || selectedUser.name || "User"}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user._id} value={user._id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image || user.photoUrl || ""} />
                  <AvatarFallback className="text-xs">
                    {(user.username || user.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{user.username || user.name || "User"}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;
