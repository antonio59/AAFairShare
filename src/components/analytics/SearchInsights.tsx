import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, MapPin, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SearchInsights = () => {
  const [searchType, setSearchType] = useState<"location" | "category">("location");
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [dateRange, setDateRange] = useState<"lifetime" | "year" | "quarter" | "month">("lifetime");
  const { toast } = useToast();

  const getStartDate = () => {
    const now = new Date();
    switch (dateRange) {
      case "month": return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      case "quarter": return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0];
      case "year": return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      default: return undefined;
    }
  };

  const locationResult = useQuery(
    api.analytics.getLocationSpending,
    searchType === "location" && submittedTerm ? { locationName: submittedTerm, startDate: getStartDate() } : "skip"
  );

  const categoryResult = useQuery(
    api.analytics.getCategorySpending,
    searchType === "category" && submittedTerm ? { categoryName: submittedTerm, startDate: getStartDate() } : "skip"
  );

  const result = searchType === "location" ? locationResult : categoryResult;

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({ title: "Search term required", description: "Please enter a name to search", variant: "destructive" });
      return;
    }
    setSubmittedTerm(searchTerm.trim());
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
        <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Search Spending Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs value={searchType} onValueChange={(v) => { setSearchType(v as "location" | "category"); setSubmittedTerm(""); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="location"><MapPin className="h-4 w-4 mr-2" />Location</TabsTrigger>
              <TabsTrigger value="category"><Tag className="h-4 w-4 mr-2" />Category</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{searchType === "location" ? "Location Name" : "Category Name"}</Label>
              <Input placeholder={`Enter ${searchType} name...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as "lifetime" | "year" | "quarter" | "month")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={!searchTerm.trim()} className="w-full">Search</Button>

          {result && result.count > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Results for "{submittedTerm}"</h3>
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
                  <p className="text-xs text-gray-500 mb-1">% of Total</p>
                  <p className="text-lg font-semibold text-gray-700">{result.periodTotal ? ((result.total / result.periodTotal) * 100).toFixed(1) : 'N/A'}%</p>
                </div>
              </div>
            </div>
          )}
          {result && result.count === 0 && submittedTerm && (
            <p className="text-center text-gray-500 mt-4">No expenses found for "{submittedTerm}"</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchInsights;
