import { Expense } from "@/types";

// Export data to CSV
export const exportToCSV = (
  data: Expense[], 
  year: number, 
  month: number, 
  user1Name: string, 
  user2Name: string,
  totalExpenses: number,
  user1Paid: number,
  user2Paid: number,
  settlementAmount: number,
  settlementDirection: string
): string => {
  // Create CSV header with all fields
  const headers = ['Date', 'Category', 'Location', 'Description', 'Amount', 'Paid By', 'Split Type'];
  
  // Format data rows
  const rows = data.map(expense => [
    expense.date,
    expense.category,
    expense.location,
    expense.description || '',
    expense.amount.toFixed(2), // Ensure two decimal places
    expense.paidBy === "1" ? user1Name : user2Name, // Use actual usernames
    expense.split
  ]);
  
  // Combine headers and rows
  const csvContentRows = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];

  // Add summary information
  csvContentRows.push(''); // Blank line for separation
  csvContentRows.push(`Total Expenses:,${totalExpenses.toFixed(2)}`);
  csvContentRows.push(`${user1Name} Paid:,${user1Paid.toFixed(2)}`);
  csvContentRows.push(`${user2Name} Paid:,${user2Paid.toFixed(2)}`);
  csvContentRows.push(`Settlement Amount:,${settlementAmount.toFixed(2)}`);
  csvContentRows.push(`Settlement Direction:,${settlementDirection}`);
  
  return csvContentRows.join('\n');
};

// Download as CSV
export const downloadCSV = (expenses: Expense[], year: number, month: number, user1Name: string, user2Name: string): void => {
  const csvContent = exportToCSV(expenses, year, month, user1Name, user2Name, 0, 0, 0, 0, '');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_${monthName}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
