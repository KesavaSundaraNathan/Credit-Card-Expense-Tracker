export const CATEGORIES = [
  { id: "food", label: "Food & Dining", color: "--cat-1" },
  { id: "groceries", label: "Groceries", color: "--cat-2" },
  { id: "shopping", label: "Shopping", color: "--cat-3" },
  { id: "transport", label: "Transport", color: "--cat-4" },
  { id: "bills", label: "Bills & Utilities", color: "--cat-5" },
  { id: "entertainment", label: "Entertainment", color: "--cat-6" },
  { id: "health", label: "Health", color: "--cat-7" },
  { id: "other", label: "Other", color: "--cat-8" },
];

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
