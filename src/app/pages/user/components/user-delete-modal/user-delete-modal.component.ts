import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../data/interfaces/user';

@Component({
  selector: 'app-user-delete-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-delete-modal.component.html',
  styleUrls: ['../../styles/user-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDeleteModalComponent {
  @Input() open = false;
  @Input() user: User | null = null;
  @Input() deleting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }
}
