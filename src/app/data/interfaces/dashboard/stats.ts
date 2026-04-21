export type DashboardTimeType = 'monthly' | 'yearly';

export interface DashboardStatsQuery {
  type: DashboardTimeType;
  year?: number;
  month?: number;
  status?: string;
  role?: string;
  method?: string;
}

export interface DashboardChartSeries {
  labels: string[];
  datasets: { label: string; data: number[]; backgroundColor?: string }[];
}

export type DashboardTrendChartKind = 'bar' | 'line' | 'doughnut' | 'pie';
