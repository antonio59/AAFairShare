import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateSelectorProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  allowClear?: boolean;
  label?: string;
}

const DateSelector = ({
  selectedDate,
  onChange,
  allowClear = false,
  label = "Date",
}: DateSelectorProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      onChange(selectedDate);
      setIsOpen(false);
    }
  };

  const TriggerButton = (
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        !date && "text-muted-foreground",
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : <span>Pick a date</span>}
    </Button>
  );

  const CalendarComponent = (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      initialFocus
      className="p-3"
    />
  );

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div className="flex items-center gap-2">
        {isMobile ? (
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{label}</DrawerTitle>
              </DrawerHeader>
              <div className="flex justify-center pb-6">
                {CalendarComponent}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {CalendarComponent}
            </PopoverContent>
          </Popover>
        )}
        {allowClear && date && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => {
              setDate(undefined);
              onChange(null);
            }}
            aria-label="Clear date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateSelector;
