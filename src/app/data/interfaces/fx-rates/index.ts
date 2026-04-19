export interface FxRatesLatestResponse {
  success?: boolean;
  base?: string;
  date?: string;
  rates: Record<string, number>;
}
