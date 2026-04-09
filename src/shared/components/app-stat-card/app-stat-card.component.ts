import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [class]="'stat-card--' + color">
      <div class="stat-card__icon">
        <ng-content></ng-content>
      </div>
      <div class="stat-card__info">
        <span class="stat-card__label">{{ label }}</span>
        <span class="stat-card__value">{{ value }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 16px;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .stat-card:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
      .stat-card__icon {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .stat-card__icon ::ng-deep svg {
        width: 20px;
        height: 20px;
      }

      .stat-card--blue .stat-card__icon { background: var(--color-blue-bg); color: var(--color-blue); }
      .stat-card--green .stat-card__icon { background: var(--color-green-bg); color: var(--color-green); }
      .stat-card--orange .stat-card__icon { background: var(--color-orange-bg); color: var(--color-orange); }
      .stat-card--purple .stat-card__icon { background: var(--color-purple-bg); color: var(--color-purple); }

      .stat-card__info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .stat-card__label {
        font-size: 12px;
        color: var(--color-text);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .stat-card__value {
        font-size: 20px;
        font-weight: 700;
        color: var(--color-text-dark);
      }
    `,
  ],
})
export class AppStatCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  @Input() color: 'blue' | 'green' | 'orange' | 'purple' = 'blue';
}
