import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-stat-card.component.html',
  styleUrl: './app-stat-card.component.css',
})
export class AppStatCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  @Input() color: 'blue' | 'green' | 'orange' | 'purple' = 'blue';
}
