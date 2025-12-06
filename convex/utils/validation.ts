const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function assertValidMonth(month: string, context = "month") {
  if (typeof month !== "string" || !monthRegex.test(month)) {
    throw new Error(`${context} must be in YYYY-MM format`);
  }
}

export function assertValidDate(date: string, context = "date") {
  if (typeof date !== "string" || !dateRegex.test(date)) {
    throw new Error(`${context} must be in YYYY-MM-DD format`);
  }
}

export function assertPositiveAmount(amount: number, context = "amount") {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${context} must be a positive number`);
  }
}
