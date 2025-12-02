import { useState, useRef } from "react";
import { Camera, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGenerateUploadUrl } from "@/hooks/useConvexData";
import { Id } from "../../../convex/_generated/dataModel";

interface ReceiptUploadProps {
  receiptId: Id<"_storage"> | null;
  onUpload: (storageId: Id<"_storage">) => void;
  onRemove: () => void;
}

const ReceiptUpload = ({ receiptId, onUpload, onRemove }: ReceiptUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useGenerateUploadUrl();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to Convex
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();
      onUpload(storageId as Id<"_storage">);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      setPreviewUrl(null);
      alert("Failed to upload receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mb-6">
      <Label>Receipt (Optional)</Label>
      <div className="mt-2">
        {previewUrl || receiptId ? (
          <div className="relative w-full max-w-xs">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full rounded-lg border"
              />
            )}
            {!previewUrl && receiptId && (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add receipt photo</span>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default ReceiptUpload;
