import { useState, useRef } from "react";
import { Camera, X, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGenerateUploadUrl } from "@/hooks/useConvexData";
import { DEMO_MODE } from "@/lib/demoData";
import { Id } from "../../../convex/_generated/dataModel";

interface ReceiptUploadProps {
  receiptId: Id<"_storage"> | null;
  onUpload: (storageId: Id<"_storage">) => void;
  onRemove: () => void;
}

const ReceiptUpload = ({ receiptId, onUpload, onRemove }: ReceiptUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useGenerateUploadUrl();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (DEMO_MODE) return;
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
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">
        Receipt <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>
      {DEMO_MODE && (
        <p className="text-xs text-muted-foreground mb-2">Uploads disabled in demo mode.</p>
      )}
      <div>
        {previewUrl || receiptId ? (
          <div className="relative inline-block">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="h-20 w-auto rounded-lg border"
              />
            )}
            {!previewUrl && receiptId && (
              <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            {isUploading ? (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="inline-flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={DEMO_MODE}
                >
                  <Camera className="h-4 w-4" />
                  <span>Take Photo</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={DEMO_MODE}
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
              </div>
            )}
          </>
        )}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading || DEMO_MODE}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading || DEMO_MODE}
        />
      </div>
    </div>
  );
};

export default ReceiptUpload;
