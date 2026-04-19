import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import { balance, dashboard, fxRate } from '../../data/services';
import type { RevenueExportMethod, RevenueExportQuery, RevenueExportTimeType } from '../../data/interfaces/dashboard/revenue-export';
import { BalanceMoneyItem, BalanceResponse } from '../../data/interfaces/balance';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.css',
})
export class BalanceComponent implements OnInit {
  data: BalanceResponse | null = null;
  loading = true;

  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'error',
  };

  private readonly api = inject(balance.ApiService);
  private readonly dashboardApi = inject(dashboard.ApiService);
  private readonly fxApi = inject(fxRate.ApiService);
  private readonly destroyRef = inject(DestroyRef);

  usdToVndRate: number | null = null;
  fxRateLoading = true;

  exportType: RevenueExportTimeType = 'monthly';
  /** Luôn có giá trị hợp lệ để request khớp dropdown và backend luôn nhận `year`. */
  exportYear!: number;
  exportMethod: RevenueExportMethod = 'vnpay';
  exportLoading = false;
  yearOptions: number[] = [];

  readonly exportMethods: { value: RevenueExportMethod; label: string }[] = [
    { value: 'vnpay', label: 'VNPay' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'cash', label: 'Tiền mặt' },
  ];

  ngOnInit(): void {
    const y = new Date().getFullYear();
    this.yearOptions = [y - 2, y - 1, y, y + 1];
    this.exportYear = y;
    this.load();
  }

  load(): void {
    this.fetchUsdVndRate();
    this.loading = true;
    this.api
      .getBalance()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          this.data = res;
        },
        error: (err: { error?: { message?: string } }) =>
          this.showNotification(err.error?.message || 'Tải số dư thất bại.', 'error'),
      });
  }

  isUsd(item: BalanceMoneyItem): boolean {
    return item.currency.trim().toLowerCase() === 'usd';
  }

  /**
   * Gợi ý cạnh số tiền — phần đang chờ nhấn mạnh thời gian xử lý ~2–3 ngày.
   */
  balanceContextMessage(item: BalanceMoneyItem, section: 'available' | 'pending'): string {
    if (section === 'pending') {
      if (item.amount < 0) {
        return 'Số dư đang âm và đang chờ xử lý — vui lòng thanh toán cho nền tảng. Thời gian cập nhật thường khoảng 2–3 ngày.';
      }
      if (item.amount > 0) {
        return 'Khoản này đang chờ — thường cần khoảng 2–3 ngày để chuyển sang số dư khả dụng.';
      }
      return 'Đang chờ xác nhận — thường khoảng 2–3 ngày để cập nhật.';
    }

    if (item.amount < 0) {
      return 'Hiện tại số dư đang âm — vui lòng thanh toán cho nền tảng để tiếp tục sử dụng dịch vụ và tránh gián đoạn.';
    }
    if (item.amount > 0) {
      return 'Số dư đang dương — bạn có thể sử dụng cho các giao dịch trên nền tảng.';
    }
    return 'Số dư đang bằng 0 — chưa có số dư khả dụng cho khoản này.';
  }

  formatUsdPrimary(item: BalanceMoneyItem): string {
    const major = item.amount / 100;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(major);
    } catch {
      return `${major.toFixed(2)} USD`;
    }
  }

  formatUsdAsVnd(item: BalanceMoneyItem): string {
    const rate = this.usdToVndRate;
    if (rate == null) return '';
    const major = item.amount / 100;
    const vnd = Math.round(major * rate);
    return this.formatVnd(vnd);
  }

  formatMoney(item: BalanceMoneyItem): string {
    const major = item.amount / 100;
    const code = item.currency.trim().toLowerCase();

    if (code === 'vnd') {
      return this.formatVnd(Math.round(major));
    }

    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: item.currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(major);
    } catch {
      return `${major.toLocaleString('vi-VN')} ${item.currency.toUpperCase()}`;
    }
  }

  private fetchUsdVndRate(): void {
    this.fxRateLoading = true;
    this.fxApi
      .getUsdVndRate()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
        finalize(() => {
          this.fxRateLoading = false;
        }),
      )
      .subscribe((rate) => {
        this.usdToVndRate = rate !== null && Number.isFinite(rate) ? rate : null;
      });
  }

  private formatVnd(value: number): string {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${value.toLocaleString('vi-VN')} VND`;
    }
  }

  exportRevenueExcel(): void {
    const year = Number.isFinite(this.exportYear) ? this.exportYear : new Date().getFullYear();
    const q: RevenueExportQuery = {
      type: this.exportType,
      method: this.exportMethod,
      year,
    };

    this.exportLoading = true;
    this.dashboardApi
      .exportRevenueReport(q)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.exportLoading = false)),
      )
      .subscribe({
        next: (res) => this.handleExportResponse(res),
        error: (err: unknown) => this.handleExportError(err),
      });
  }

  private handleExportResponse(res: HttpResponse<Blob>): void {
    const blob = res.body;
    if (!blob) {
      this.showNotification('Không nhận được file từ máy chủ.', 'error');
      return;
    }
    const ct = (res.headers.get('Content-Type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      blob.text().then(
        (text) => {
          try {
            const j = JSON.parse(text) as { message?: string };
            this.showNotification(j.message || 'Xuất Excel không thành công.', 'error');
          } catch {
            this.showNotification('Xuất Excel không thành công.', 'error');
          }
        },
        () => this.showNotification('Xuất Excel không thành công.', 'error'),
      );
      return;
    }
    const filename = this.filenameFromContentDisposition(res.headers.get('Content-Disposition'));
    this.downloadBlob(blob, filename);
    this.showNotification('Đã tải file Excel.', 'success');
  }

  private handleExportError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.error instanceof Blob) {
      err.error.text().then(
        (text) => {
          try {
            const j = JSON.parse(text) as { message?: string };
            this.showNotification(j.message || 'Xuất Excel không thành công.', 'error');
          } catch {
            this.showNotification('Xuất Excel không thành công.', 'error');
          }
        },
        () => this.showNotification('Xuất Excel không thành công.', 'error'),
      );
      return;
    }
    const msg =
      err instanceof HttpErrorResponse
        ? (typeof err.error === 'object' && err.error && 'message' in err.error
            ? String((err.error as { message?: unknown }).message)
            : err.message)
        : err instanceof Error
          ? err.message
          : 'Xuất Excel thất bại.';
    this.showNotification(msg || 'Xuất Excel thất bại.', 'error');
  }

  private filenameFromContentDisposition(header: string | null): string {
    if (!header) {
      return `doanh-thu-${new Date().toISOString().slice(0, 10)}.xlsx`;
    }
    const star = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
    if (star?.[1]) {
      try {
        return decodeURIComponent(star[1].replace(/"/g, ''));
      } catch {
        /* fall through */
      }
    }
    const quoted = /filename="([^"]+)"/i.exec(header);
    if (quoted?.[1]) return quoted[1];
    const plain = /filename=([^;\s]+)/i.exec(header);
    if (plain?.[1]) return plain[1].replace(/"/g, '');
    return `doanh-thu-${new Date().toISOString().slice(0, 10)}.xlsx`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = { show: true, message, type };
  }
}
