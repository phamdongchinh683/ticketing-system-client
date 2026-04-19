export type RevenueExportTimeType = 'monthly' | 'year';

export type RevenueExportMethod = 'vnpay' | 'stripe' | 'cash';

export interface RevenueExportQuery {
  type: RevenueExportTimeType;
  year: number;
  method: RevenueExportMethod;
}
