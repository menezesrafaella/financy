export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  iconKey?: string | null;
  colorKey?: string | null;
  transactionCount?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: string;
  category?: Category;
}

export interface SummaryItem {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  total: number;
  colorKey?: string | null;
  iconKey?: string | null;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  byCategory: SummaryItem[];
}
