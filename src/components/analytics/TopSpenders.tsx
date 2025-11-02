import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award } from "lucide-react";
import { CategorySummary, LocationSummary } from "@/types";

interface TopSpendersProps {
  categories: CategorySummary[];
  locations: LocationSummary[];
  limit?: number;
}

const TopSpenders = ({ categories, locations, limit = 5 }: TopSpendersProps) => {
  const topCategories = [...categories]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const topLocations = [...locations]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

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
            {topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{category.name}</p>
                    {category.percentage && (
                      <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(category.total)}</p>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No category data available</p>
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
            {topLocations.map((location, index) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{location.name}</p>
                    {location.percentage && (
                      <p className="text-xs text-gray-500">{location.percentage.toFixed(1)}% of total</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(location.total)}</p>
                </div>
              </div>
            ))}
            {topLocations.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No location data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopSpenders;
