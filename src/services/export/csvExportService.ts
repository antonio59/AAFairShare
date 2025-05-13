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
  settlementDirection: string,
  user1Id: string, 
  user2Id: string  
): string => {
  // Create CSV header with all fields
  const headers = ['Date', 'Category', 'Location', 'Description', 'Amount', 'Paid By', 'Split Type'];
  
  // Format data rows
  const rows = data.map(expense => [
    expense.date,
    expense.category,
    expense.location || "-", 
    expense.description || '',
    expense.amount.toFixed(2), 
    expense.paidBy === user1Id ? user1Name : (expense.paidBy === user2Id ? user2Name : 'Unknown'), 
    expense.split
  ]);

  // Calculate total for the expenses table
  const expensesTableTotal = data.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRow = ['', '', '', 'Total:', expensesTableTotal.toFixed(2), '', ''];
  
  // Combine headers and rows
  const csvContentRows = [
    headers.join(','),
    ...rows.map(row => row.join(',')), 
    totalRow.join(',') 
  ];

  // Add summary information (Settlement Details section)
  csvContentRows.push(''); 
  csvContentRows.push('Settlement Summary:');
  csvContentRows.push(`Total Expenses:,${totalExpenses.toFixed(2)}`); 
  csvContentRows.push(`${user1Name} Paid:,${user1Paid.toFixed(2)}`);
  csvContentRows.push(`${user2Name} Paid:,${user2Paid.toFixed(2)}`);
  csvContentRows.push(`Settlement Amount:,${settlementAmount.toFixed(2)}`);
  csvContentRows.push(`Settlement Direction:,${settlementDirection}`);
  
  return csvContentRows.join('\n');
};

// Download as CSV
export const downloadCSV = (expenses: Expense[], year: number, month: number, user1Name: string, user2Name: string, user1Id: string, user2Id: string): void => {
  const totalExp = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const csvContent = exportToCSV(expenses, year, month, user1Name, user2Name, totalExp, 0, 0, 0, '', user1Id, user2Id);
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
