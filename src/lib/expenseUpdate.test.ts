import { describe, expect, it } from "bun:test";
import { buildExpenseUpdate } from "./expenseUpdate";

const categories = [{ _id: "cat_groceries", name: "Groceries" }];
const locations = [{ id: "loc_tesco", name: "Tesco" }];

const expense = {
  amount: 12.5,
  date: "2026-03-02",
  description: "Weekly shop",
  split: "custom",
  category: "Groceries",
  location: "Tesco",
  paidBy: "user_jamie",
  linkedDocumentIds: ["doc_1"],
};

describe("buildExpenseUpdate", () => {
  it("sends category, location, and payer ids with the edited fields", () => {
    expect(buildExpenseUpdate(expense, categories, locations)).toEqual({
      amount: 12.5,
      date: "2026-03-02",
      description: "Weekly shop",
      splitType: "custom",
      categoryId: "cat_groceries",
      locationId: "loc_tesco",
      categoryName: "Groceries",
      locationName: "Tesco",
      paidById: "user_jamie",
      linkedDocumentIds: ["doc_1"],
    });
  });

  it("leaves the id empty when the picker name is not in the database yet", () => {
    const update = buildExpenseUpdate(
      { ...expense, category: "Dining", location: "New cafe" },
      categories,
      locations,
    );
    expect(update.categoryId).toBeUndefined();
    expect(update.categoryName).toBe("Dining");
    expect(update.locationId).toBeUndefined();
    expect(update.locationName).toBe("New cafe");
  });

  it("rejects a missing payer, category, or location", () => {
    expect(() => buildExpenseUpdate({ ...expense, paidBy: "" }, categories, locations)).toThrow(/who paid/);
    expect(() => buildExpenseUpdate({ ...expense, category: " " }, categories, locations)).toThrow(/category/);
    expect(() => buildExpenseUpdate({ ...expense, location: "" }, categories, locations)).toThrow(/location/);
  });
});