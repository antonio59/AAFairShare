export interface NamedRow {
  _id?: string;
  id?: string;
  name: string;
}

export interface EditableExpense {
  amount: number;
  date: string;
  description?: string;
  split: string;
  category: string;
  location: string;
  paidBy: string;
  linkedDocumentIds?: string[] | null;
}

function rowId(row: NamedRow): string {
  return row._id || row.id || "";
}

export function buildExpenseUpdate(
  expense: EditableExpense,
  categories: NamedRow[],
  locations: NamedRow[],
) {
  const categoryName = expense.category.trim();
  const locationName = expense.location.trim();
  if (!categoryName) throw new Error("Choose a category");
  if (!locationName) throw new Error("Choose a location");
  if (!expense.paidBy) throw new Error("Choose who paid");

  const category = categories.find((row) => row.name === categoryName);
  const location = locations.find((row) => row.name === locationName);

  return {
    amount: expense.amount,
    date: expense.date,
    description: expense.description,
    splitType: expense.split,
    categoryId: category ? rowId(category) : undefined,
    locationId: location ? rowId(location) : undefined,
    categoryName,
    locationName,
    paidById: expense.paidBy,
    linkedDocumentIds: expense.linkedDocumentIds ?? undefined,
  };
}
