import type { TransactionType } from "../types";

export type CategoryAccent = "green" | "blue" | "purple" | "orange" | "pink" | "yellow" | "red";

export const CATEGORY_COLOR_OPTIONS: CategoryAccent[] = [
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow"
];

export const CATEGORY_ICON_OPTIONS: string[] = [
  "briefcase-business",
  "car-front",
  "heart-pulse",
  "piggy-bank",
  "shopping-cart",
  "ticket",
  "baggage-claim",
  "utensils",
  "paw-print",
  "house",
  "gift",
  "dumbbell",
  "book-open",
  "tool-case",
  "mailbox",
  "receipt-text"
];

const ACCENT_SET = new Set<string>(CATEGORY_COLOR_OPTIONS);

const ACCENT_ROTATE: CategoryAccent[] = ["blue", "purple", "orange", "pink", "yellow"];

function hashAccent(name: string): CategoryAccent {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  }
  return ACCENT_ROTATE[Math.abs(h) % ACCENT_ROTATE.length];
}

export function isCategoryAccent(value: string | null | undefined): value is CategoryAccent {
  return !!value && ACCENT_SET.has(value);
}

export function getCategoryAccent(categoryName: string, type: TransactionType): CategoryAccent {
  const n = categoryName.toLowerCase();
  if (n.includes("aliment")) return "blue";
  if (n.includes("transport")) return "purple";
  if (n.includes("mercad")) return "orange";
  if (n.includes("entreten")) return "pink";
  if (n.includes("saúde") || n.includes("saude")) return "red";
  if (n.includes("invest")) return "green";
  if (n.includes("util") || n.includes("aluguel") || n.includes("alugu")) return "yellow";
  if (type === "INCOME") return "green";
  return hashAccent(categoryName);
}

export function resolveCategoryAccent(category: {
  name: string;
  type?: TransactionType | null;
  colorKey?: string | null;
}): CategoryAccent {
  if (isCategoryAccent(category.colorKey)) {
    return category.colorKey;
  }
  return getCategoryAccent(category.name, category.type ?? "EXPENSE");
}

export function getTransactionIconPath(categoryName: string, type: TransactionType): string {
  const n = categoryName.toLowerCase();
  if (n.includes("aliment")) return "/assets/Icon/utensils.svg";
  if (n.includes("transport")) return "/assets/Icon/car-front.svg";
  if (n.includes("mercad")) return "/assets/Icon/shopping-cart.svg";
  if (n.includes("entreten")) return "/assets/Icon/ticket.svg";
  if (n.includes("saúde") || n.includes("saude")) return "/assets/Icon/heart-pulse.svg";
  if (n.includes("util") && !n.includes("alug")) return "/assets/Icon/gift.svg";
  if (n.includes("aluguel") || n.includes("alugu")) return "/assets/Icon/house.svg";
  if (n.includes("invest")) return "/assets/Icon/piggy-bank.svg";
  if (n.includes("salá") || n.includes("salario") || n.includes("freelance")) {
    return "/assets/Icon/briefcase-business.svg";
  }
  if (type === "INCOME") return "/assets/Icon/briefcase-business.svg";
  return "/assets/Icon/receipt-text.svg";
}

export function resolveCategoryIconPath(category: {
  name: string;
  type?: TransactionType | null;
  iconKey?: string | null;
}): string {
  const key = category.iconKey?.trim();
  if (key) {
    return `/assets/Icon/${key}.svg`;
  }
  return getTransactionIconPath(category.name, category.type ?? "EXPENSE");
}
