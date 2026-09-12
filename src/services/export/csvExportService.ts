import { Expense } from "@/types";

// Download as CSV (simplified - works without user info)
export const downloadCSV = (expenses: Expense[], year: number, month: number): void => {
  // Create simple CSV
  const headers = ['Date', 'Category', 'Location', 'Description', 'Amount', 'Paid By', 'Split Type'];
  
  const rows = expenses.map(expense => [
    expense.date,
    expense.category,
    expense.location || '-',
    expense.description || '',
    expense.amount.toFixed(2),
    expense.paidBy || 'Unknown',
    expense.split
  ]);

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRow = ['', '', '', 'Total:', total.toFixed(2), '', ''];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    totalRow.join(',')
  ].join('\n');

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
