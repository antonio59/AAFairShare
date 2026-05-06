import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DocumentInsightsProps {
  withDocuments: number;
  total: number;
  coverage: number;
}

const DocumentInsights = ({ withDocuments, total, coverage }: DocumentInsightsProps) => {
  const getIcon = () => {
    if (coverage >= 80) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (coverage >= 50) return <Minus className="h-5 w-5 text-amber-500" />;
    return <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  const getMessage = () => {
    if (coverage >= 80) return "Great record keeping!";
    if (coverage >= 50) return "Good progress.";
    if (total === 0) return "No expenses this month.";
    return "Attach more receipts/bills.";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Document Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{coverage}%</p>
            <p className="text-sm text-muted-foreground">
              {withDocuments} of {total} expenses have documents
            </p>
          </div>
          <div className="text-right">
            {getIcon()}
            <p className="text-xs text-muted-foreground mt-1">{getMessage()}</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              coverage >= 80 ? "bg-green-500" : coverage >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${coverage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentInsights;
