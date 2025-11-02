import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, MapPin, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getLocationSpending, getCategorySpending } from "@/services/api/analyticsService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpendingResult {
  total: number;
  count: number;
  average: number;
  periodTotal?: number;
  periodCount?: number;
}

const SearchInsights = () => {
  const [searchType, setSearchType] = useState<"location" | "category">("location");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<"lifetime" | "year" | "quarter" | "month">("lifetime");
  const [result, setResult] = useState<SpendingResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a location or category to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const now = new Date();
      let startDate: Date | null = null;

      switch (dateRange) {
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          break;
        }
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      let data;
      if (searchType === "location") {
        data = await getLocationSpending(searchTerm, startDate);
      } else {
        data = await getCategorySpending(searchTerm, startDate);
      }

      if (data.count === 0) {
        toast({
          title: "No results found",
          description: `No expenses found for ${searchType} "${searchTerm}"`,
        });
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Failed to fetch spending data",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  const getPeriodLabel = () => {
    switch (dateRange) {
      case "month": return "This Month";
      case "quarter": return "This Quarter";
      case "year": return "This Year";
      default: return "All Time";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "location" | "category")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="location">
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </TabsTrigger>
              <TabsTrigger value="category">
                <Tag className="h-4 w-4 mr-2" />
                Category
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">
                {searchType === "location" ? "Location Name" : "Category Name"}
              </Label>
              <Input
                id="search"
                placeholder={`Enter ${searchType} name...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Time Period</Label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as "lifetime" | "year" | "quarter" | "month")}>
                <SelectTrigger id="dateRange">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchTerm.trim()}
            className="w-full"
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Results for "{searchTerm}"
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total Spent ({getPeriodLabel()})</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.total)}</p>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Number of Expenses</p>
                  <p className="text-2xl font-bold text-gray-700">{result.count}</p>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Average per Expense</p>
                  <p className="text-lg font-semibold text-gray-700">{formatCurrency(result.average)}</p>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Percentage of Total</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {result.periodTotal ? ((result.total / result.periodTotal) * 100).toFixed(1) : 'N/A'}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchInsights;
