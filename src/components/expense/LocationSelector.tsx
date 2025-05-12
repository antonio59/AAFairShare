import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { getLocations, createLocation } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Location } from "@/types"; // Assuming Location type exists

interface LocationSelectorProps {
  selectedLocation: string;
  onChange: (location: string) => void;
}

const LocationSelector = ({ selectedLocation, onChange }: LocationSelectorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch locations
  const { data: locations = [] } = useQuery<Location[]>({ // Provide default empty array
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  // Mutation for creating a location
  const mutation = useMutation({ 
    mutationFn: createLocation,
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onChange(newLocation.name);
      setOpen(false);
      setSearchValue(""); // Clear search on success
      toast({ title: "Location added", description: `${newLocation.name} created.` });
    },
    onError: (error) => {
      console.error("Failed to create location:", error);
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLocation = (locationName: string) => {
    const trimmedName = locationName.trim();
    if (!trimmedName) return;
    // Check if location already exists (case-insensitive)
    const exists = locations.some(loc => loc.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      toast({ title: "Location exists", description: `${trimmedName} already exists.`, variant: "default" });
      // Select the existing one
      const existingLocation = locations.find(loc => loc.name.toLowerCase() === trimmedName.toLowerCase());
      if (existingLocation) {
        onChange(existingLocation.name);
        setOpen(false);
        setSearchValue("");
      }
    } else {
      mutation.mutate(trimmedName);
    }
  };

  // Filtered locations based on search value
  const filteredLocations = searchValue
    ? locations.filter((location) =>
        location.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : locations;

  const exactMatchExists = locations.some(loc => loc.name.toLowerCase() === searchValue.trim().toLowerCase());
  const showCreateOption = searchValue.trim() !== "" && !exactMatchExists && !mutation.isPending;

  // Effect to update search value when external selection changes
  useEffect(() => {
    setSearchValue(selectedLocation || "");
  }, [selectedLocation]);

  return (
    <div className="mb-6">
      <Label htmlFor="location-combobox">Location</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="location-combobox"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mt-1"
          >
            {selectedLocation
              ? locations.find((location) => location.name === selectedLocation)?.name
              : "Select location..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false} > {/* We handle filtering manually */}
            <CommandInput 
              placeholder="Search location or add new..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {searchValue.trim() === "" ? "Type to search..." : 
                 mutation.isPending ? "Creating location..." : "No location found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location.id}
                    value={location.name} // Use name for matching against searchValue
                    onSelect={(currentValue) => {
                      const selectedName = locations.find(l => l.name.toLowerCase() === currentValue.toLowerCase())?.name || "";
                      onChange(selectedName);
                      setSearchValue(selectedName); // Update search display
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLocation === location.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {location.name}
                  </CommandItem>
                ))}
                {showCreateOption && (
                  <CommandItem
                    key="create-new"
                    value={`create-${searchValue.trim()}`}
                    onSelect={() => {
                      handleCreateLocation(searchValue);
                    }}
                    className="text-sky-600 italic"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{searchValue.trim()}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationSelector;
