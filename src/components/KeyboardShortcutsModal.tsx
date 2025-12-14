import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: "Cmd/Ctrl + N", action: "New Expense" },
  { keys: "Cmd/Ctrl + H", action: "Home/Dashboard" },
  { keys: "Cmd/Ctrl + S", action: "Settlement" },
  { keys: "Cmd/Ctrl + A", action: "Analytics" },
  { keys: "Cmd/Ctrl + R", action: "Recurring" },
  { keys: "Cmd/Ctrl + G", action: "Savings Goals" },
  { keys: "Cmd/Ctrl + ,", action: "Settings" },
  { keys: "?", action: "Show this help" },
];

const KeyboardShortcutsModal = ({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.action}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.action}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsModal;
