import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import { balance, fxRate } from '../../data/services';
import { BalanceMoneyItem, BalanceResponse } from '../../data/interfaces/balance';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, SharedModule],
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
  private readonly fxApi = inject(fxRate.ApiService);
  private readonly destroyRef = inject(DestroyRef);

  usdToVndRate: number | null = null;
  fxRateLoading = true;

  ngOnInit(): void {
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

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notification = { show: true, message, type };
  }
}
