import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { getUsers } from "@/services/expenseService";

interface UserSelectorProps {
  selectedUserId: string;
  onChange: (userId: string) => void;
}

const UserSelector = ({ selectedUserId, onChange }: UserSelectorProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userData = await getUsers();
        setUsers(userData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  return (
    <div className="mb-6">
      <Label htmlFor="user">Paid By</Label>
      <div className="mt-1">
        <Select
          value={selectedUserId}
          onValueChange={onChange}
          disabled={loading || users.length === 0}
        >
          <SelectTrigger id="user">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center">
                    {user.avatar && (
                      <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-5 h-5 rounded-full mr-2" 
                      />
                    )}
                    {user.username}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default UserSelector;
