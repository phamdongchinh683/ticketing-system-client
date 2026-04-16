import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../data/interfaces/user';

@Component({
  selector: 'app-user-list-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list-panel.component.html',
  styleUrls: ['../../styles/user-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPanelComponent {
  @Input() users: User[] = [];
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() nextCursor: number | null = null;

  @Output() loadMore = new EventEmitter<void>();
  @Output() editUser = new EventEmitter<User>();
  @Output() passwordUser = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<User>();
  @Output() notifyUser = new EventEmitter<User>();

  displayStatus(value: string): string {
    switch (value) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm ngưng';
      case 'banned':
        return 'Bị cấm';
      default:
        return value;
    }
  }

  displayRole(value: string): string {
    switch (value) {
      case 'driver':
        return 'Tài xế';
      case 'customer':
        return 'Khách hàng';
      case 'admin':
        return 'Quản trị viên';
      default:
        return value;
    }
  }
}
