// Format month string for database queries
export const formatMonthString = (year: number, month: number) => {
  return `${year}-${month.toString().padStart(2, "0")}`;
};

export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1; // JavaScript months are 0-indexed
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};
