// Category constants derived from the database schema
// This ensures consistency between the database constraints and the UI

export const CATEGORIES = [
  'transportation',
  'food', 
  'bills',
  'entertainment',
  'shopping',
  'healthcare',
  'education',
  'travel',
  'groceries',
  'utilities',
  'others'
] as const

export type Category = typeof CATEGORIES[number]

// Category display labels mapping
export const CATEGORY_LABELS: Record<Category, string> = {
  transportation: 'Transportation',
  food: 'Food & Dining',
  bills: 'Bills & Utilities',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  healthcare: 'Healthcare',
  education: 'Education',
  travel: 'Travel',
  groceries: 'Groceries',
  utilities: 'Utilities',
  others: 'Others'
}

// Utility function to get category label
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as Category] || category
}

// Utility function to check if a category is valid
export function isValidCategory(category: string): category is Category {
  return CATEGORIES.includes(category as Category)
}

// Utility function to get all category labels
export function getAllCategoryLabels(): Record<string, string> {
  return CATEGORY_LABELS
}

// Utility function to get categories from data
export function getCategoriesFromData<T extends { category: string }>(data: T[]): Category[] {
  const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
  return uniqueCategories.filter(isValidCategory)
}
