
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingScreenProps {
  loadingText: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ loadingText }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-64 space-y-4 text-center">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <p className="text-lg font-medium">{loadingText}</p>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    </div>
  );
};

export default LoadingScreen;
