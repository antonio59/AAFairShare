import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TotalSummaryCardProps {
  totalExpenses: number;
}

const TotalSummaryCard = ({ totalExpenses }: TotalSummaryCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Total Expenses For Period</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          £{totalExpenses ? totalExpenses.toFixed(2) : "0.00"}
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalSummaryCard;