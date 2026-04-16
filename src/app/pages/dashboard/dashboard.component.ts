import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { dashboard } from '../../data/services/index';
import { DashboardOverview } from '../../data/interfaces/dashboard';
import type {
  DashboardChartSeries,
  DashboardStatsQuery,
  DashboardTimeType,
  DashboardTrendChartKind,
} from '../../data/interfaces/dashboard/stats';
import { SharedModule } from '@app/shared/shared.module';
import { DashboardStatsGridComponent } from './components/dashboard-stats-grid/dashboard-stats-grid.component';
import { DashboardChartsToolbarComponent } from './components/dashboard-charts-toolbar/dashboard-charts-toolbar.component';
import { DashboardTrendChartPanelComponent } from './components/dashboard-trend-chart-panel/dashboard-trend-chart-panel.component';
import {
  BOOKING_STATUS_KEYS,
  chartSeriesGrandTotal,
  REVENUE_METHOD_KEYS,
  REVENUE_STATUS_KEYS,
  resolveBookingChartSeries,
  resolveRevenueChartSeries,
  resolveUserChartSeries,
  USER_ROLE_KEYS,
  USER_STATUS_KEYS,
} from './utils/dashboard-stats.mapper';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    DashboardStatsGridComponent,
    DashboardChartsToolbarComponent,
    DashboardTrendChartPanelComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  overview: DashboardOverview | null = null;
  loading = true;

  userChartLoading = false;
  bookingChartLoading = false;
  revenueChartLoading = false;

  userChart: DashboardChartSeries = { labels: [], datasets: [] };
  bookingChart: DashboardChartSeries = { labels: [], datasets: [] };
  revenueChart: DashboardChartSeries = { labels: [], datasets: [] };

  chartType: DashboardTimeType = 'monthly';
  selectedYear = new Date().getFullYear();
  yearOptions: number[] = [];

  /** Chuỗi rỗng = Tất cả (không gửi query param). */
  bookingStatusFilter = '';
  revenueMethodFilter = '';
  revenueStatusFilter = '';
  userStatusFilter = '';
  userRoleFilter = '';

  readonly bookingStatuses = [...BOOKING_STATUS_KEYS];
  readonly revenueMethods = [...REVENUE_METHOD_KEYS];
  readonly revenueStatuses = [...REVENUE_STATUS_KEYS];
  readonly userStatuses = [...USER_STATUS_KEYS];
  readonly userRoles = [...USER_ROLE_KEYS];

  /** Visual only — does not refetch data. */
  userChartKind: DashboardTrendChartKind = 'line';
  bookingChartKind: DashboardTrendChartKind = 'bar';
  revenueChartKind: DashboardTrendChartKind = 'doughnut';

  readonly chartKindOptions: { value: DashboardTrendChartKind; label: string }[] = [
    { value: 'line', label: 'Đường' },
    { value: 'bar', label: 'Cột' },
    { value: 'doughnut', label: 'Vòng tròn' },
    { value: 'pie', label: 'Tròn' },
  ];

  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'error',
  };

  constructor(private api: dashboard.ApiService) {}

  ngOnInit() {
    const y = new Date().getFullYear();
    this.yearOptions = [y - 2, y - 1, y, y + 1];

    this.api.getDashboard().subscribe({
      next: (res) => {
        this.overview = res.overview;
        this.loading = false;
      },
      error: (err: { error?: { message?: string } }) => {
        this.showNotification(err.error?.message || 'Tải tổng quan thất bại.', 'error');
        this.loading = false;
      },
    });

    this.loadAllTrendCharts();
  }

  private baseStatsQuery(): DashboardStatsQuery {
    const q: DashboardStatsQuery = { type: this.chartType };
    if (this.chartType === 'monthly') {
      q.year = this.selectedYear;
    }
    return q;
  }

  private bookingQuery(): DashboardStatsQuery {
    const q = this.baseStatsQuery();
    if (this.bookingStatusFilter) q.status = this.bookingStatusFilter;
    return q;
  }

  private revenueQuery(): DashboardStatsQuery {
    const q = this.baseStatsQuery();
    if (this.revenueMethodFilter) q.method = this.revenueMethodFilter;
    if (this.revenueStatusFilter) q.status = this.revenueStatusFilter;
    return q;
  }

  private userQuery(): DashboardStatsQuery {
    const q = this.baseStatsQuery();
    if (this.userStatusFilter) q.status = this.userStatusFilter;
    if (this.userRoleFilter) q.role = this.userRoleFilter;
    return q;
  }

  /** Thay đổi chu kỳ / năm sẽ tác động đến toàn bộ biểu đồ xu hướng. */
  loadAllTrendCharts() {
    this.loadUserChart();
    this.loadBookingChart();
    this.loadRevenueChart();
  }

  loadUserChart() {
    this.userChartLoading = true;
    resolveUserChartSeries(this.api, this.userQuery())
      .pipe(finalize(() => (this.userChartLoading = false)))
      .subscribe({
        next: (data) => {
          this.userChart = this.localizeDatasetLabels(data);
        },
        error: (err: { error?: { message?: string } }) => {
          this.showNotification(err.error?.message || 'Tải biểu đồ người dùng thất bại.', 'error');
        },
      });
  }

  loadBookingChart() {
    this.bookingChartLoading = true;
    resolveBookingChartSeries(this.api, this.bookingQuery())
      .pipe(finalize(() => (this.bookingChartLoading = false)))
      .subscribe({
        next: (data) => {
          this.bookingChart = this.localizeDatasetLabels(data);
        },
        error: (err: { error?: { message?: string } }) => {
          this.showNotification(err.error?.message || 'Tải biểu đồ đặt vé thất bại.', 'error');
        },
      });
  }

  loadRevenueChart() {
    this.revenueChartLoading = true;
    resolveRevenueChartSeries(this.api, this.revenueQuery())
      .pipe(finalize(() => (this.revenueChartLoading = false)))
      .subscribe({
        next: (data) => {
          this.revenueChart = this.localizeDatasetLabels(data);
        },
        error: (err: { error?: { message?: string } }) => {
          this.showNotification(err.error?.message || 'Tải biểu đồ doanh thu thất bại.', 'error');
        },
      });
  }

  onGlobalTrendFiltersChange() {
    this.loadAllTrendCharts();
  }

  onChartTypeUpdated(value: DashboardTimeType) {
    this.chartType = value;
    this.onGlobalTrendFiltersChange();
  }

  onSelectedYearUpdated(year: number) {
    this.selectedYear = year;
    this.onGlobalTrendFiltersChange();
  }

  onUserChartFiltersChange() {
    this.loadUserChart();
  }

  onBookingChartFiltersChange() {
    this.loadBookingChart();
  }

  onRevenueChartFiltersChange() {
    this.loadRevenueChart();
  }

  /** Sum of all points in the current chart (matches stacked bar totals). */
  trendTotal(chart: DashboardChartSeries): number {
    return chartSeriesGrandTotal(chart);
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  displayStatusLabel(value: string): string {
    switch (value) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm ngưng';
      case 'banned':
        return 'Bị cấm';
      case 'pending':
        return 'Chờ xử lý';
      case 'paid':
        return 'Đã thanh toán';
      case 'cancelled':
        return 'Đã hủy';
      case 'expired':
        return 'Hết hạn';
      case 'success':
        return 'Thành công';
      case 'failed':
        return 'Thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return value;
    }
  }

  displayRoleLabel(value: string): string {
    switch (value) {
      case 'admin':
        return 'Quản trị viên';
      case 'customer':
        return 'Khách hàng';
      case 'driver':
        return 'Tài xế';
      default:
        return value;
    }
  }

  displayMethodLabel(value: string): string {
    switch (value) {
      case 'cash':
        return 'Tiền mặt';
      case 'vnpay':
        return 'VNPay';
      default:
        return value;
    }
  }

  private localizeDatasetLabels(chart: DashboardChartSeries): DashboardChartSeries {
    return {
      labels: chart.labels,
      datasets: chart.datasets.map((dataset) => ({
        ...dataset,
        label: this.localizeDatasetLabel(dataset.label),
      })),
    };
  }

  private localizeDatasetLabel(label: string): string {
    if (label.includes(' · ')) {
      return label
        .split(' · ')
        .map((part) => this.localizeDatasetLabel(part))
        .join(' · ');
    }

    switch (label) {
      case 'Users':
        return 'Người dùng';
      case 'Revenue':
        return 'Doanh thu';
      default:
        return this.displayStatusLabel(this.displayRoleLabel(this.displayMethodLabel(label)));
    }
  }
}
