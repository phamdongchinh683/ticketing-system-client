export interface DashboardOverview {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalCompanies: number;
}

export interface DashboardResponse {
  overview: DashboardOverview;
}

export type {
  DashboardTimeType,
  DashboardStatsQuery,
  DashboardChartSeries,
  DashboardTrendChartKind,
} from './stats';