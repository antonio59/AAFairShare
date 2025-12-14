// Format month string for database queries
export const formatMonthString = (year: number, month: number) => {
  return `${year}-${month.toString().padStart(2, "0")}`;
};

// Function to get the current month data for display
export const getCurrentMonthLabel = (): string => {
  const date = new Date();
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1; // JavaScript months are 0-indexed
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};
