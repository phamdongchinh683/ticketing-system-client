import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { notification } from '../../../../data/services';
import { NotificationItem, VerifyAccountStatus } from '../../../../data/interfaces/notification';
import { Messaging } from '@angular/fire/messaging';
import { onMessage } from 'firebase/messaging';


@Component({
  selector: 'app-main-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-topbar.component.html',
  styleUrl: './main-topbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainTopbarComponent implements OnInit {
  @Input() pageTitle = '';

  @Output() signOut = new EventEmitter<void>();

  notifications: NotificationItem[] = [];
  isNotificationOpen = false;
  isLoadingNotifications = false;
  isLoadingMore = false;
  nextCursor: number | null = null;
  lastRequestedCursor: number | null = null;
  isFetching = false;
  selectedNotification: NotificationItem | null = null;
  isVerifyDialogOpen = false;
  isVerifyingAccount = false;

  readonly verifyStatuses: Array<{ value: VerifyAccountStatus; label: string }> = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Tạm ngưng' },
    { value: 'banned', label: 'Bị cấm' },
  ];

  private readonly notificationApi = inject(notification.ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly messaging = inject(Messaging);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const unsubscribe = onMessage(this.messaging, (payload) => {
      this.handleIncomingFcmPayload(payload);
    });
    this.destroyRef.onDestroy(() => unsubscribe());

    const swMessageHandler = (event: MessageEvent) => {
      if (event.data?.type !== 'FCM_BACKGROUND_MESSAGE') return;
      this.handleIncomingFcmPayload(event.data.payload);
    };
    navigator.serviceWorker?.addEventListener('message', swMessageHandler);
    this.destroyRef.onDestroy(() => navigator.serviceWorker?.removeEventListener('message', swMessageHandler));

    this.loadNotifications();
  }

  get unreadCount(): number {
    return this.notifications.reduce((count, noti) => count + (noti.isRead ? 0 : 1), 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.isNotificationOpen || this.isVerifyDialogOpen) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.host.nativeElement.contains(target)) {
      this.isNotificationOpen = false;
    }
  }

  toggleNotifications() {
    this.isNotificationOpen = !this.isNotificationOpen;
    this.cdr.markForCheck();
    if (this.isNotificationOpen && this.notifications.length === 0 && !this.isLoadingNotifications) {
      this.loadNotifications();
    }
  }

  onNotificationScroll(event: Event) {
    const target = event.target as HTMLElement;
    const threshold = 64;
    const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
    if (!reachedBottom) return;
    this.loadMoreNotifications();
  }

  onNotificationClick(noti: NotificationItem) {
    this.markNotificationAsRead(noti);
    this.openVerifyDialog(noti);
  }

  closeVerifyDialog() {
    if (this.isVerifyingAccount) return;
    this.isVerifyDialogOpen = false;
    this.selectedNotification = null;

    this.cdr.markForCheck();
  }

  submitVerifyAccount(status: VerifyAccountStatus) {
    if (!this.selectedNotification || this.isVerifyingAccount) return;

    const accountId = this.resolveUserNewAccountId(this.selectedNotification);
    if (accountId === '' || accountId === null || accountId === undefined) {
      this.cdr.markForCheck();
      return;
    }

    this.isVerifyingAccount = true;
    this.notificationApi
      .verifyAccount({ id: Number(accountId), status })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isVerifyingAccount = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.isVerifyDialogOpen = false;
          this.selectedNotification = null;
        },
        error: () => {
        },
      });
  }

  notificationTitle(noti: NotificationItem): string {
    return noti.title?.trim() || 'Thông báo';
  }

  notificationBody(noti: NotificationItem): string {
    return noti.body?.trim() || '';
  }

  trackByNotificationId(_index: number, noti: NotificationItem): string {
    return String(noti.id);
  }

  private loadNotifications() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.isLoadingNotifications = true;
    this.lastRequestedCursor = null;

    this.notificationApi
      .getNotifications()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isFetching = false;
          this.isLoadingNotifications = false;
        }),
      )
      .subscribe({
        next: (res) => {
          const incoming = res.notifications ? res.notifications.map((item) => this.normalizeNotification(item)) : [];
          this.notifications = incoming;
          this.nextCursor = this.parseNextCursor(res.next);
          this.cdr.markForCheck();
        },
      });
  }

  private loadMoreNotifications() {
    if (this.isFetching || this.nextCursor === null) return;
    if (this.lastRequestedCursor === this.nextCursor && this.notifications.length > 0) return;

    this.isFetching = true;
    this.isLoadingMore = true;
    const next = this.nextCursor;
    this.lastRequestedCursor = next;

    this.notificationApi
      .getNotifications(next)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isFetching = false;
          this.isLoadingMore = false;
        }),
      )
      .subscribe({
        next: (res) => {
          const incoming = res.notifications ? res.notifications.map((item) => this.normalizeNotification(item)) : [];
          this.notifications = this.mergeNotifications(this.notifications, incoming);
          this.nextCursor = res.next ? res.next : null;
          if (this.nextCursor !== next) this.lastRequestedCursor = null;
          this.cdr.markForCheck();
        },
      });
  }

  private mergeNotifications(current: NotificationItem[], incoming: NotificationItem[]): NotificationItem[] {
    const merged = [...current];
    const seen = new Set(current.map((item) => String(item.id)));
    for (const item of incoming) {
      const key = String(item.id);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged;
  }

  private parseNextCursor(next: unknown): number | null {
    if (typeof next === 'number' && Number.isFinite(next)) return next;
    if (typeof next === 'string' && next.trim() !== '' && !Number.isNaN(Number(next))) return Number(next);
    return null;
  }

  private handleIncomingFcmPayload(payload: {
    notification?: {
      title?: string;
      body?: string;
    };
    data?: Record<string, string>;
  }) {

    const incoming: NotificationItem = {
      id: payload.data?.['id'] ?? '',
      userId: payload.data?.['userId'] ?? '',
      title: payload.notification?.title ?? '',
      body: payload.notification?.body ?? '',
      data: payload.data,
      isRead: false,
    };
    this.notifications = this.mergeNotifications([this.normalizeNotification(incoming)], this.notifications);

    this.cdr.markForCheck();
  }

  private setReadStatus(notificationId: NotificationItem['id'], isRead: boolean): NotificationItem[] {
    return this.notifications.map((item) => (item.id === notificationId ? { ...item, isRead } : item));
  }

  private markNotificationAsRead(noti: NotificationItem) {
    if (noti.isRead) return;
    this.notifications = this.setReadStatus(noti.id, true);
    this.cdr.markForCheck();

    this.notificationApi
      .markAsRead(noti.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.notifications = this.setReadStatus(noti.id, false);
          this.cdr.markForCheck();
        },
      });
  }

  private openVerifyDialog(noti: NotificationItem) {
    this.selectedNotification = noti;
    this.isVerifyDialogOpen = true;

    this.cdr.markForCheck();
  }

  private normalizeNotification(item: NotificationItem): NotificationItem {
    const d = item.data;
    if (d == null) return item;
    if (typeof d !== 'string') return item;
    const trimmed = d.trim();
    if (trimmed === '') return item;
    try {
      return { ...item, data: JSON.parse(trimmed) as Record<string, unknown> };
    } catch {
      return item;
    }
  }

  private resolveUserNewAccountId(noti: NotificationItem): string | number | undefined {
    const data = this.getNotificationDataRecord(noti);
    const id = data?.['userNewAccountId'];
    if (id !== undefined && id !== null && String(id).trim() !== '') return id as string | number;
    return undefined;
  }

  private getNotificationDataRecord(noti: NotificationItem): Record<string, unknown> | null {
    const raw = noti.data;
    if (raw == null) return null;
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (t === '') return null;
      try {
        const parsed = JSON.parse(t) as unknown;
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
    return null;
  }

}

