import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getLocations, createLocation, deleteLocation, checkLocationUsage } from "@/services/expenseService";
import { MapPin, Plus, Trash } from "lucide-react";

const LocationsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLocationName, setNewLocationName] = useState("");
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false); 
  const [isLocationInUse, setIsLocationInUse] = useState(false); 

  const { data: locations = [], isLoading, error } = useQuery<{ id: string; name: string; }[]>({ 
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const createLocationMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setNewLocationName("");
      toast({
        title: "Location created",
        description: "New location has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setDeleteLocationId(null);
      toast({
        title: "Location deleted",
        description: "Location has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete location. It may be in use or another error occurred.",
        variant: "destructive",
      });
    }
  });

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newLocationName.trim();
    if (!trimmedName) return;

    const alreadyExists = locations.some(
      loc => loc.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      toast({
        title: "Duplicate Location",
        description: `A location named "${trimmedName}" already exists.`,
        variant: "default", 
      });
      return; 
    }
    
    createLocationMutation.mutate(trimmedName);
  };

  const confirmDeleteLocation = async (id: string, name: string) => {
    setIsCheckingUsage(true);
    try {
      const isInUse = await checkLocationUsage(id); 
      setIsLocationInUse(isInUse);
      setDeleteLocationId(id); 
    } catch (err) {
       console.error("Error during usage check:", err);
       toast({ title: "Error", description: "Could not check if location is in use.", variant: "destructive" });
       setDeleteLocationId(null); 
    } finally {
      setIsCheckingUsage(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteLocationId || isLocationInUse || isCheckingUsage) return; 
    
    deleteLocationMutation.mutate(deleteLocationId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddLocation} className="mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="New location name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              type="submit" 
              disabled={createLocationMutation.isPending || !newLocationName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </form>

        <div className="space-y-1 mt-2">
          {isLoading ? (
            <div className="text-center py-4">Loading locations...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">Error loading locations</div>
          ) : locations && locations.length > 0 ? (
            locations.map((location) => (
              <div 
                key={location.id}
                className="flex items-center justify-between p-3 rounded hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-3" />
                  <span>{location.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => confirmDeleteLocation(location.id, location.name)} 
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No locations found</div>
          )}
        </div>

        <AlertDialog open={!!deleteLocationId} onOpenChange={() => setDeleteLocationId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {isCheckingUsage 
                  ? "Checking if location is in use..."
                  : isLocationInUse
                  ? "This location cannot be deleted because it is currently assigned to one or more expenses."
                  : "This will permanently delete this location. This action cannot be undone."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteLocation}
                disabled={isLocationInUse || isCheckingUsage || deleteLocationMutation.isPending} 
                className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLocationMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default LocationsManager;
