import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocations, useCreateLocation, useDeleteLocation } from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";
import { MapPin, Plus, Trash } from "lucide-react";

const LocationsManager = () => {
  const { toast } = useToast();
  const [newLocationName, setNewLocationName] = useState("");
  const [deleteLocationId, setDeleteLocationId] = useState<Id<"locations"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const locations = useLocations();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();

  const isLoading = locations === undefined;

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newLocationName.trim();
    if (!trimmedName) return;

    const alreadyExists = locations?.some(loc => loc.name.toLowerCase() === trimmedName.toLowerCase());
    if (alreadyExists) {
      toast({ title: "Duplicate Location", description: `"${trimmedName}" already exists.` });
      return;
    }

    try {
      await createLocation({ name: trimmedName });
      setNewLocationName("");
      toast({ title: "Location created", description: "New location has been added." });
    } catch {
      toast({ title: "Error", description: "Failed to create location.", variant: "destructive" });
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteLocationId) return;
    setIsDeleting(true);
    try {
      await deleteLocation({ id: deleteLocationId });
      toast({ title: "Location deleted", description: "Location has been removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete location.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteLocationId(null);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Manage Locations</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleAddLocation} className="mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input type="text" placeholder="New location name" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} className="pl-10" />
            </div>
            <Button type="submit" disabled={!newLocationName.trim()}><Plus className="h-4 w-4 mr-2" />Add</Button>
          </div>
        </form>

        <div className="space-y-1 mt-2">
          {isLoading ? (
            <div className="text-center py-4">Loading locations...</div>
          ) : locations && locations.length > 0 ? (
            [...locations].sort((a, b) => a.name.localeCompare(b.name)).map((location) => (
              <div key={location._id} className="flex items-center justify-between p-3 rounded hover:bg-muted">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-3" />
                  <span>{location.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-500/10" onClick={() => setDeleteLocationId(location._id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">No locations found</div>
          )}
        </div>

        <AlertDialog open={!!deleteLocationId} onOpenChange={() => setDeleteLocationId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this location.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLocation} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default LocationsManager;
