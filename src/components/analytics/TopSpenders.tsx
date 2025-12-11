import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Tags, MapPin } from "lucide-react";
import { CategorySummary, LocationSummary } from "@/types";

interface TopSpendersProps {
  categories: CategorySummary[];
  locations: LocationSummary[];
  limit?: number;
}

const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-6">
    <Icon className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

const TopSpenders = ({ categories, locations, limit = 5 }: TopSpendersProps) => {
  const topCategories = [...categories]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const topLocations = [...locations]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (index === 1) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    if (index === 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankStyle(index)}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{category.name}</p>
                      {category.percentage !== undefined && category.percentage > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{category.percentage.toFixed(1)}% of total</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(category.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                icon={Tags} 
                message="No category data for this period." 
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topLocations.length > 0 ? (
              topLocations.map((location, index) => (
                <div key={location.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankStyle(index)}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{location.name}</p>
                      {location.percentage !== undefined && location.percentage > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{location.percentage.toFixed(1)}% of total</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(location.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                icon={MapPin} 
                message="No location data for this period." 
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopSpenders;
