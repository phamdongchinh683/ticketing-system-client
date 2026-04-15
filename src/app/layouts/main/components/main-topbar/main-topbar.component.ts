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
import { NotificationItem } from '../../../../data/interfaces/notification';
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
  isFetching = false;

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
    if (!this.isNotificationOpen) return;
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

  readNotification(noti: NotificationItem) {
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

  notificationTitle(noti: NotificationItem): string {
    return noti.title?.trim() || 'Notification';
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
          const incoming = res.notifications ? res.notifications : [];
          this.notifications = incoming;
          this.nextCursor = this.parseNextCursor(res.next);
          this.cdr.markForCheck();
        },
      });
  }

  private loadMoreNotifications() {
    if (this.isFetching || this.nextCursor === null) return;

    this.isFetching = true;
    this.isLoadingMore = true;
    const next = this.nextCursor;

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
          const incoming = res.notifications ? res.notifications : [];
          this.notifications = this.mergeNotifications(this.notifications, incoming);
          this.nextCursor = this.parseNextCursor(res.next);
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
      title: payload.notification?.title ?? '',
      body: payload.notification?.body ?? '',
      userId: payload.data?.['userId'] ?? '',
      isRead: false,
    };
    this.notifications = this.mergeNotifications([incoming], this.notifications);
    this.cdr.markForCheck();
  }

  private setReadStatus(notificationId: NotificationItem['id'], isRead: boolean): NotificationItem[] {
    return this.notifications.map((item) => (item.id === notificationId ? { ...item, isRead } : item));
  }
}
