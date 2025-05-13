import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TooltipProps } from "recharts";

interface PieChartData {
  name: string;
  value: number;
}

interface MonthlyPieChartProps {
  title: string;
  data: PieChartData[];
  colors: string[];
}

// Custom tooltip for the pie chart
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border border-border/50 rounded-lg p-1.5 sm:p-2 shadow-md">
        <p className="font-medium text-xs sm:text-sm">{`${data.name}: ${data.value}%`}</p>
      </div>
    );
  }
  return null;
};

const MonthlyPieChart = ({ title, data, colors }: MonthlyPieChartProps) => {
  return (
    <div className="h-56 sm:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            // Removed the label prop that was showing percentages
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyPieChart;
