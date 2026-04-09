export interface DashboardOverview {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalCompanies: number;
}

export interface DashboardResponse {
  overview: DashboardOverview;
}