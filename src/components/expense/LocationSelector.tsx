import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from "lucide-react";
import { useLocations, useCreateLocation } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

interface LocationSelectorProps {
  selectedLocation: string;
  onChange: (location: string) => void;
}

const LocationSelector = ({ selectedLocation, onChange }: LocationSelectorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const locationsData = useLocations();
  const locations = locationsData ?? [];
  const isLoading = locationsData === undefined;
  const createLocation = useCreateLocation();

  const handleCreateLocation = async (locationName: string) => {
    const trimmedName = locationName.trim();
    if (!trimmedName) return;

    const exists = locations.some(loc => loc.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      toast({ title: "Location exists", description: `${trimmedName} already exists.` });
      const existingLocation = locations.find(loc => loc.name.toLowerCase() === trimmedName.toLowerCase());
      if (existingLocation) {
        onChange(existingLocation.name);
        setOpen(false);
        setSearchValue("");
      }
    } else {
      setIsCreating(true);
      try {
        await createLocation({ name: trimmedName });
        onChange(trimmedName);
        setOpen(false);
        setSearchValue("");
        toast({ title: "Location added", description: `${trimmedName} created.` });
      } catch (error) {
        console.error("Failed to create location:", error);
        toast({
          title: "Error",
          description: "Failed to add location. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    }
  };

  const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));
  
  const filteredLocations = searchValue
    ? sortedLocations.filter((location) =>
        location.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : sortedLocations;

  const exactMatchExists = locations.some(loc => loc.name.toLowerCase() === searchValue.trim().toLowerCase());
  const showCreateOption = searchValue.trim() !== "" && !exactMatchExists && !isCreating;

  useEffect(() => {
    if (selectedLocation) {
      setSearchValue(selectedLocation);
    }
  }, [selectedLocation]);

  return (
    <div className="mb-4">
      <Label htmlFor="location-combobox">Location</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="location-combobox"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mt-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading locations...
              </span>
            ) : selectedLocation ? (
              locations.find((location) => location.name === selectedLocation)?.name || selectedLocation
            ) : (
              "Select location..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search location or add new..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {searchValue.trim() === "" ? "Type to search..." :
                 isCreating ? "Creating location..." : "No location found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location._id}
                    value={location.name}
                    onSelect={(currentValue) => {
                      const selectedName = locations.find(l => l.name.toLowerCase() === currentValue.toLowerCase())?.name || "";
                      onChange(selectedName);
                      setSearchValue(selectedName);
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
