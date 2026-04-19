export interface BalanceMoneyItem {
  amount: number;
  currency: string;
}

export interface BalanceResponse {
  available: BalanceMoneyItem[];
  pending: BalanceMoneyItem[];
}
