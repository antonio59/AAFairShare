const ExpenseTableHeader = () => {
  return (
    <thead className="bg-muted/50">
      <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <th className="px-4 py-3 w-28">Date</th>
        <th className="px-4 py-3 w-48">Category / Location</th>
        <th className="px-4 py-3">Description</th>
        <th className="px-4 py-3 w-24 text-right">Amount</th>
        <th className="px-4 py-3 w-32">Paid By</th>
        <th className="px-4 py-3 w-20 text-center">Split</th>
        <th className="px-4 py-3 w-24 text-center">Actions</th>
      </tr>
    </thead>
  );
};

export default ExpenseTableHeader;
